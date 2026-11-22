import prisma from "../../../db/db.config";
import { builderQuery } from "../../builders/prismaBuilderQuery";
import AppError from "../../errors/AppError";
import {
  orderedSubjectsForClass,
  sortRowsBySubjectOrder,
} from "../subject/subject.util";
import {
  computeAndApplyMonthlySummary,
  getStudentGroup,
  computeMonthlyResultSummary,
  computeIct,
  ICT_PRACTICAL_CUTOFF,
  ICT_EXAM_MAX,
  ICT_EXAM_PASS_MARK,
  ICT_FULL_MARKS,
  getIctExamFromStoredTotal,
  getIctStoredTotalFromExam,
  isIctPracticalApplicable,
  isIctSubject,
  isMonthlyResultNewForIct,
  isSubjectAbsent,
} from "../../utils/monthlyResultSummary";

// ICT contract (new class 9/10 monthly): client sends exam mark (0-25).
// Server computes practical via computeIct: exam>=9 => practical=exam,total=exam*2;
// exam<9 => practical=0,total=exam; absent => 0. Stored marks is total.
// For old/non-applicable rows, marks is treated as stored total (clamped to 0-50).
const normalizeIctResultRows = (args: {
  rows: any[];
  className?: string | number | null;
  createdAt?: Date | string | null;
  existingRows?: any[];
}) => {
  const { rows, className, createdAt, existingRows = [] } = args;
  const ictApplicable = isIctPracticalApplicable(className, createdAt);
  const existingById = new Map(existingRows.map((r: any) => [r.id, r]));
  const existingIct = existingRows.find((r: any) => isIctSubject(r.subjectName));

  return (rows || []).map((row: any) => {
    const source = row?.id ? existingById.get(row.id) : undefined;
    const subjectName = String(row?.subjectName ?? source?.subjectName ?? "").trim();
    const isIct = isIctSubject(subjectName);
    if (!isIct) return row;

    const absent = isSubjectAbsent(row) || (row?.isAbsent === undefined && isSubjectAbsent(source));
    if (!ictApplicable) {
      // Old/non-applicable: preserve stored total; only clamp to ICT full marks.
      const raw = row?.marks ?? row?.marksObtained ?? source?.marks ?? 0;
      const total = absent ? 0 : Math.max(0, Math.min(ICT_FULL_MARKS, Number(raw) || 0));
      return { ...row, marks: total, fullMarks: ICT_FULL_MARKS, isAbsent: absent };
    }

    // New class 9/10 ICT: client sends exam mark (max 25). Server computes exam/practical/total.
    const rawExam = row?.marks ?? row?.marksObtained ?? row?.examMarks ?? row?.ictExamMark;
    const ict = computeIct(absent ? null : rawExam, absent);
    return { ...row, marks: ict.total, ictExamMark: ict.exam, fullMarks: ICT_FULL_MARKS, isAbsent: absent };
  }).map((row: any) => {
    // Ensure existing ICT row can be identified even if subject name casing differs.
    if (isIctSubject(row?.subjectName) || (row?.id && existingIct && row.id === existingIct.id)) {
      return { ...row, fullMarks: ICT_FULL_MARKS };
    }
    return row;
  });
};

/**
 * Create Monthly Result
 */
const create = async (payload: any) => {
  const existingResult = await prisma.monthlyExamResult.findFirst({
    where: {
      studentId: payload.studentId,
      month: payload.month,
    },
  });

  if (existingResult) {
    throw new AppError(409, "Monthly result already exists for this student in this month");
  }

  const { studentId, results, ...restPayload } = payload;

  const studentInfo = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    select: {
      classId: true,
      batchId: true,
      stdRegNo: true,
      stdClass: { select: { className: true } },
    },
  });

  const classSubjects = await orderedSubjectsForClass(studentInfo.classId);
  const normalizedResults = normalizeIctResultRows({
    rows: Array.isArray(results) ? results : [],
    className: studentInfo.stdClass?.className,
    createdAt: new Date(), // new result
  });
  // Validate ICT. New class 9/10: exam 0-25, total derived by computeIct.
  for (const r of normalizedResults) {
    if (!isIctSubject(r.subjectName)) continue;
    const ictApplicable = isIctPracticalApplicable(studentInfo.stdClass?.className, new Date());
    const absent = !!r.isAbsent;
    const total = Number(r.marks) || 0;
    const exam = Number(r.ictExamMark ?? getIctExamFromStoredTotal(total, absent) ?? 0);
    if (ictApplicable) {
      if (absent) {
        if (total !== 0) throw new AppError(400, "ICT: absent ICT must have 0 marks");
      } else {
        if (exam < 0 || exam > ICT_EXAM_MAX) throw new AppError(400, "ICT: exam mark must be between 0 and 25");
        const expected = computeIct(exam, false);
        if (total !== expected.total) throw new AppError(400, `ICT: total must be ${expected.total} for exam ${exam}`);
      }
    } else {
      if (total < 0 || total > ICT_FULL_MARKS) throw new AppError(400, "ICT: marks must be between 0 and 50");
    }
  }
  const summary = computeMonthlyResultSummary({
    resultSubjects: normalizedResults,
    classSubjects,
    group: getStudentGroup(studentInfo.stdRegNo),
    classNumber: studentInfo.stdClass?.className,
    fallbackTotalMarks: restPayload.totalMarks,
    createdAt: new Date(),
  });

  const created = await (prisma.monthlyExamResult.create as any)({
    data: {
      ...restPayload,
      totalMarks: summary.full,
      gpa: summary.gpa,
      grade: summary.grade,
      // NEW results (>= cutoff) follow the automatic ICT rule; mark practical as applied.
      ictPracticalAdded: isMonthlyResultNewForIct(new Date()) ? true : !!(payload as any).ictPracticalAdded,

      student: { connect: { id: studentId } },
      stdClass: { connect: { id: studentInfo.classId } },

      ...(studentInfo.batchId && {
        batch: { connect: { id: studentInfo.batchId } },
      }),

      results: {
        create: normalizedResults.map((r: any) => ({
          subjectName: r.subjectName,
          marks: Number(r.marks) || 0,
          fullMarks: Number(r.fullMarks) || 100,
          highestMark: Number(r.highestMark) || 0,
          point: Number(r.point) || 0,
          grade: String(r.grade || "F"),
          isAbsent: !!r.isAbsent,
          ...(isIctSubject(r.subjectName) && r.ictExamMark !== undefined ? { ictExamMark: Number(r.ictExamMark) } : {}),
        })),
      },
    },

    include: {
      student: { include: { stdClass: true } },
      batch: true,
      results: true,
    },
  });

  created.results = sortRowsBySubjectOrder(created.results, classSubjects);
  await computeAndApplyMonthlySummary(created);
  return created;
};

/**
 * Get All Monthly Results
 */
const getAll = async (query: Record<string, any>) => {
  const parsedFilter = query.filter ? JSON.parse(query.filter) : {};

  const { batchId, month, year, ...restFilter } = parsedFilter;

  const searchTerm: string = query.searchTerm || "";

  const searchCondition = searchTerm
    ? {
        OR: [
          { month: { contains: searchTerm } },
          { student: { stdRegNo: { contains: searchTerm } } },
          { student: { name: { contains: searchTerm } } },
          { student: { parentPhone: { contains: searchTerm } } },
        ],
      }
    : null;

  const batchCondition = batchId
    ? { OR: [{ batchId }, { student: { batchId } }] }
    : null;

  const MONTH_CANONICAL: Record<string, string> = {
    "1": "January", "01": "January", "jan": "January", "january": "January",
    "2": "February", "02": "February", "feb": "February", "february": "February",
    "3": "March", "03": "March", "mar": "March", "march": "March",
    "4": "April", "04": "April", "apr": "April", "april": "April",
    "5": "May", "05": "May", "may": "May",
    "6": "June", "06": "June", "jun": "June", "june": "June",
    "7": "July", "07": "July", "jul": "July", "july": "July",
    "8": "August", "08": "August", "aug": "August", "august": "August",
    "9": "September", "09": "September", "sep": "September", "sept": "September", "september": "September",
    "10": "October", "oct": "October", "october": "October",
    "11": "November", "nov": "November", "november": "November",
    "12": "December", "dec": "December", "december": "December",
  };
  const rawMonth = month ? String(month).trim() : "";
  const monthKey = rawMonth.toLowerCase();
  const normalizedMonth = rawMonth ? (MONTH_CANONICAL[monthKey] || rawMonth) : "";
  // Month field is the exam month (stored on MonthlyExamResult.month), never createdAt.
  const monthCondition = normalizedMonth
    ? { month: { equals: normalizedMonth, mode: "insensitive" as const } }
    : null;

  // Year filter: prefer stored exam year field; fallback to createdAt UTC year while year is null.
  const parsedYear =
    year !== undefined && year !== null && String(year).trim() !== "" && String(year).toLowerCase() !== "all"
      ? Number(year)
      : null;
  const hasYear = parsedYear !== null && Number.isInteger(parsedYear);
  const yearCondition = hasYear
    ? {
        OR: [
          { year: parsedYear } as any,
          {
            AND: [
              { year: null } as any,
              {
                createdAt: {
                  gte: new Date(Date.UTC(parsedYear, 0, 1)),
                  lt: new Date(Date.UTC(parsedYear + 1, 0, 1)),
                },
              },
            ],
          },
        ],
      }
    : null;

  const monthlyResultQuery = builderQuery({
    searchFields: [],
    searchTerm: "",
    filter: restFilter,
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : { createdAt: "desc" },
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
  });

  const andConditions = [
    monthlyResultQuery.where,
    searchCondition,
    batchCondition,
    monthCondition,
    yearCondition,
  ].filter((c) => c !== null && Object.keys(c).length > 0);

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  const totalMonthlyResults = await prisma.monthlyExamResult.count({
    where,
  });
  const currentPage = Number(query.page) || 1;
  const totalPages = Math.ceil(totalMonthlyResults / monthlyResultQuery.take);
  const response = await prisma.monthlyExamResult.findMany({
    ...monthlyResultQuery,
    where,
    include: {
      student: {
        include: {
          stdClass: true,
        },
      },
      batch: true,
      results: true,
    },
  });

  const classIds = [
    ...new Set(
      response
        .map((result) => result.student?.classId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const subjectsByClass = new Map<string, { subjectName: string }[]>();
  if (classIds.length > 0) {
    const subjectLists = await Promise.all(
      classIds.map((classId) => orderedSubjectsForClass(classId)),
    );
    classIds.forEach((classId, index) => {
      subjectsByClass.set(classId, subjectLists[index]);
    });
  }
  for (const result of response) {
    const classId = result.student?.classId;
    if (classId) {
      const orderedSubjects = subjectsByClass.get(classId);
      if (orderedSubjects) {
        result.results = sortRowsBySubjectOrder(result.results, orderedSubjects);
      }
    }
    await computeAndApplyMonthlySummary(result);
  }

  return {
    meta: {
      totalItems: totalMonthlyResults,
      totalPages,
      currentPage,
    },
    data: response,
  };
};
/**
 * Get Single Monthly Result
 */
const getById = async (id: string) => {
  const result = await prisma.monthlyExamResult.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          stdClass: true,
        },
      },
      batch: true,
      results: true,
    },
  });

  if (result?.student?.classId) {
    result.results = sortRowsBySubjectOrder(
      result.results,
      await orderedSubjectsForClass(result.student.classId),
    );
  }

  if (result) await computeAndApplyMonthlySummary(result);
  return result;
};

/**
 * Update Monthly Result
 */
const update = async (id: string, payload: any) => {
  const existing = await prisma.monthlyExamResult.findUnique({
    where: { id },
    include: { student: { include: { stdClass: true } }, results: true },
  });
  if (!existing) throw new AppError(404, "Monthly result not found");

  // Destructure results from payload if present
  const { results, ictPracticalAdded, ...restPayload } = payload;
  if (restPayload.year !== undefined && restPayload.year !== null && String(restPayload.year).trim() !== "") {
    const y = Number(restPayload.year);
    if (Number.isInteger(y)) restPayload.year = y;
  }
  if (restPayload.publishedDate) {
    const d = new Date(restPayload.publishedDate);
    restPayload.publishedDate = Number.isNaN(d.getTime()) ? null : d;
  }

  const className = existing.student?.stdClass?.className;
  const isOldClass910Result =
    !isMonthlyResultNewForIct(existing.createdAt) && /(9|10)/.test(String(className ?? ""));
  const existingIct = (existing.results || []).find((r: any) => isIctSubject(r.subjectName));
  const incomingIct = Array.isArray(results)
    ? results.find((r: any) => isIctSubject(r.subjectName) || (existingIct && r.id === existingIct.id))
    : null;
  const existingIctPracticalAdded = !!(existing as any).ictPracticalAdded;
  const requestedPracticalAdd = !!ictPracticalAdded && !existingIctPracticalAdded;
  if (requestedPracticalAdd) {
    // Old-result ICT practical: add practical = current ICT marks, so total doubles.
    // Allowed only when marks are in pass/exam range 9-25 and not already applied.
    if (!isOldClass910Result) throw new AppError(400, "ICT: practical can only be added for old class 9/10 results");
    if (!existingIct) throw new AppError(400, "ICT: ICT subject not found");
    const existingAbsent = isSubjectAbsent(existingIct);
    const existingTotal = Number(existingIct.marks) || 0;
    if (existingAbsent) throw new AppError(400, "ICT: cannot add practical for absent ICT");
    if (existingIctPracticalAdded) throw new AppError(400, "ICT: practical already added");
    if (existingTotal < ICT_EXAM_PASS_MARK || existingTotal > ICT_EXAM_MAX) {
      throw new AppError(400, "ICT: practical can be added only when marks are between 9 and 25");
    }
    if (incomingIct) {
      const incomingTotal = Number(incomingIct.marks ?? incomingIct.marksObtained ?? 0) || 0;
      if (incomingTotal !== existingTotal * 2) {
        throw new AppError(400, "ICT: practical add must make total marks double the exam marks");
      }
      if (isSubjectAbsent(incomingIct)) throw new AppError(400, "ICT: cannot add practical for absent ICT");
    }
  }

  const normalizedIncoming = Array.isArray(results)
    ? normalizeIctResultRows({
        rows: results,
        className,
        createdAt: existing.createdAt,
        existingRows: existing.results || [],
      })
    : null;
  if (Array.isArray(normalizedIncoming)) {
    for (const r of normalizedIncoming) {
      if (!isIctSubject(r.subjectName)) continue;
      const ictApplicable = isIctPracticalApplicable(className, existing.createdAt);
      const absent = !!r.isAbsent;
      const total = Number(r.marks) || 0;
      const exam = Number(r.ictExamMark ?? getIctExamFromStoredTotal(total, absent) ?? 0);
      if (ictApplicable) {
        if (absent) {
          if (total !== 0) throw new AppError(400, "ICT: absent ICT must have 0 marks");
        } else {
          if (exam < 0 || exam > ICT_EXAM_MAX) throw new AppError(400, "ICT: exam mark must be between 0 and 25");
          const expected = computeIct(exam, false);
          if (total !== expected.total) throw new AppError(400, `ICT: total must be ${expected.total} for exam ${exam}`);
        }
      } else if (total < 0 || total > ICT_FULL_MARKS) {
        throw new AppError(400, "ICT: marks must be between 0 and 50");
      }
    }
  }
  const nextIctPracticalAdded = existingIctPracticalAdded || requestedPracticalAdd || isMonthlyResultNewForIct(existing.createdAt);

  // Prepare the update object for results if provided
  let resultsUpdate = undefined;
  if (Array.isArray(normalizedIncoming)) {
    resultsUpdate = {
      update: normalizedIncoming.map((result: any) => ({
        where: { id: result.id },
        data: {
          marks: result.marks,
          fullMarks: result.fullMarks,
          highestMark: result.highestMark,
          point: result.point,
          grade: result.grade,
          isAbsent: !!result.isAbsent,
          ...(isIctSubject(result.subjectName) && result.ictExamMark !== undefined
            ? { ictExamMark: Number(result.ictExamMark) }
            : {}),
        },
      })),
    };
  }

  const updated = await (prisma.monthlyExamResult.update as any)({
    where: { id },
    data: {
      ...restPayload,
      ictPracticalAdded: nextIctPracticalAdded,
      ...(resultsUpdate && { results: resultsUpdate }),
    },
    include: {
      student: { include: { stdClass: true } },
      results: true,
    },
  });

  // Recompute GPA/Grade/TotalMarks on server for consistency (do not trust client totals).
  const classId = updated.student?.classId;
  const classSubjects = classId ? await orderedSubjectsForClass(classId) : [];
  const summary = computeMonthlyResultSummary({
    resultSubjects: updated.results || [],
    classSubjects,
    group: getStudentGroup(updated.student?.stdRegNo),
    classNumber: updated.student?.stdClass?.className,
    fallbackTotalMarks: updated.totalMarks,
    createdAt: updated.createdAt,
  });
  const recalculated = await (prisma.monthlyExamResult.update as any)({
    where: { id },
    data: {
      totalMarks: summary.full,
      gpa: summary.gpa,
      grade: summary.grade,
      ictPracticalAdded: nextIctPracticalAdded,
    },
    include: {
      student: { include: { stdClass: true } },
      results: true,
    },
  });
  if (classId) recalculated.results = sortRowsBySubjectOrder(recalculated.results, classSubjects);
  await computeAndApplyMonthlySummary(recalculated);
  return recalculated;
};

/**
 * Delete Monthly Result
 */
const remove = async (id: string) => {
  return prisma.monthlyExamResult.delete({
    where: { id },
  });
};

/**
 * Calculate positions for students in a class for a specific month+year.
 * Only results matching classId, month, year (and examName when provided) are ranked.
 * Positions of other months/years are never touched.
 */
const calculatePositionsByClass = async (
  classId: string,
  month: string,
  year?: number | string | null,
  examName?: string | null,
) => {
  if (!classId) {
    throw new AppError(400, "classId is required");
  }
  if (!month || !String(month).trim()) {
    throw new AppError(400, "month is required");
  }
  const yearProvided = year !== undefined && year !== null && String(year).trim() !== "" && String(year).toLowerCase() !== "all";
  const parsedYear = Number(year);
  if (yearProvided && (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100)) {
    throw new AppError(400, "year is invalid");
  }

  const MONTH_CANONICAL: Record<string, string> = {
    "1": "January", "01": "January", "jan": "January", "january": "January",
    "2": "February", "02": "February", "feb": "February", "february": "February",
    "3": "March", "03": "March", "mar": "March", "march": "March",
    "4": "April", "04": "April", "apr": "April", "april": "April",
    "5": "May", "05": "May", "may": "May",
    "6": "June", "06": "June", "jun": "June", "june": "June",
    "7": "July", "07": "July", "jul": "July", "july": "July",
    "8": "August", "08": "August", "aug": "August", "august": "August",
    "9": "September", "09": "September", "sep": "September", "sept": "September", "september": "September",
    "10": "October", "oct": "October", "october": "October",
    "11": "November", "nov": "November", "november": "November",
    "12": "December", "dec": "December", "december": "December",
  };
  const rawMonth = String(month).trim();
  const normalizedMonth = MONTH_CANONICAL[rawMonth.toLowerCase()] || rawMonth;
  const normalizedExamName = examName ? String(examName).trim() : "";

  const where: any = {
    classId,
    month: { equals: normalizedMonth, mode: "insensitive" as const }, // exam month field, never createdAt
  };

  // TEMPORARY year rule: optional, based on createdAt UTC year until year column is added.
  if (yearProvided) {
    const yearStart = new Date(Date.UTC(parsedYear, 0, 1));
    const yearEnd = new Date(Date.UTC(parsedYear + 1, 0, 1));
    where.createdAt = { gte: yearStart, lt: yearEnd };
  }
  if (normalizedExamName) {
    where.monthlyExamName = normalizedExamName;
  }

  const allResults = await prisma.monthlyExamResult.findMany({
    where,
    include: {
      student: { select: { name: true, stdRegNo: true, classId: true, stdClass: { select: { className: true } } } },
      results: true,
      stdClass: { select: { className: true } },
    },
  });

  if (allResults.length === 0) {
    return {
      classId,
      month: normalizedMonth,
      year: yearProvided ? parsedYear : null,
      examName: normalizedExamName || null,
      totalStudents: 0,
      updated: [],
    };
  }

  const classSubjects = await orderedSubjectsForClass(classId);

  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const ranked = allResults
    .map((result: any) => {
      const classNumber = result.stdClass?.className || result.student?.stdClass?.className;
      const group = getStudentGroup(result.student?.stdRegNo);
      const summary = computeMonthlyResultSummary({
        resultSubjects: result.results || [],
        classSubjects,
        group,
        classNumber,
        fallbackTotalMarks: result.totalMarks,
        createdAt: result.createdAt,
      });
      return {
        id: result.id,
        studentName: result.student?.name,
        obtained: summary.obtained,
      };
    })
    .sort((a: any, b: any) => b.obtained - a.obtained);

  let currentPosition = 0;
  let previousObtained: number | null = null;
  const updates: { id: string; studentName?: string; position: string; obtained: number }[] = [];

  ranked.forEach((item: any, index: number) => {
    if (previousObtained === null || item.obtained !== previousObtained) {
      currentPosition = index + 1;
      previousObtained = item.obtained;
    }
    const position = `${currentPosition}${getOrdinalSuffix(currentPosition)}`;
    updates.push({ id: item.id, studentName: item.studentName, position, obtained: item.obtained });
  });

  await prisma.$transaction(
    updates.map((u) =>
      prisma.monthlyExamResult.update({
        where: { id: u.id },
        data: { position: u.position },
      }),
    ),
  );

  return {
    classId,
    month: normalizedMonth,
    year: parsedYear,
    examName: normalizedExamName || null,
    totalStudents: updates.length,
    updated: updates.map(({ id, studentName, position }) => ({ id, studentName, position })),
  };
};
export const monthlyResultService = {
  create,
  getAll,
  getById,
  update,
  delete: remove,
  calculatePositionsByClass, // ðŸ‘ˆ à¦¯à§‹à¦— à¦•à¦°à§à¦¨
};
