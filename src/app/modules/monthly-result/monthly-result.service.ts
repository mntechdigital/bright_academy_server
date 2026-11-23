import prisma from "../../../db/db.config";
import { builderQuery } from "../../builders/prismaBuilderQuery";
import AppError from "../../errors/AppError";
import {
  orderedSubjectsForClass,
  sortRowsBySubjectOrder,
} from "../subject/subject.util";
import {
  computeAndApplyMonthlySummary,
  computePractical,
  computeMonthlyResultSummary,
  getPracticalExamFromStoredTotal,
  getPracticalSubjectSlot,
  getStudentGroup,
  ICT_EXAM_MAX,
  ICT_EXAM_PASS_MARK,
  ICT_FULL_MARKS,
  isMonthlyResultNewForPractical,
  isPracticalApplicable,
  isSubjectAbsent,
  SCIENCE_EXAM_MAX,
  SCIENCE_EXAM_PASS_MARK,
  SCIENCE_FULL_MARKS,
  SCIENCE_PRACTICAL_ADDED,
} from "../../utils/monthlyResultSummary";

// Practical contract (new class 9/10 monthly):
// - ICT: exam 0-25, pass >=9 => practical=exam,total=exam*2; fail/absent => no practical.
// - Science group only (Physics/Chemistry/Biology/Higher Math slots): exam 0-75, pass >=25 => +20 practical; fail/absent => no practical.
// Client sends exam mark in marks/examMark; server computes total via computePractical exactly once.
// Old/non-applicable rows: marks treated as stored total, clamped to full marks.
const normalizePracticalResultRows = (args: {
  rows: any[];
  className?: string | number | null;
  group?: string | null;
  createdAt?: Date | string | null;
  existingRows?: any[];
}) => {
  const { rows, className, group, createdAt, existingRows = [] } = args;
  const existingById = new Map(existingRows.map((r: any) => [r.id, r]));

  return (rows || []).map((row: any) => {
    const source = row?.id ? existingById.get(row.id) : undefined;
    const subjectName = String(row?.subjectName ?? source?.subjectName ?? "").trim();
    const slot = getPracticalSubjectSlot(subjectName, group, className);
    if (!slot) return row;

    const absent = isSubjectAbsent(row) || (row?.isAbsent === undefined && isSubjectAbsent(source));
    const applicable = isPracticalApplicable(subjectName, group, className, createdAt);
    const fullMarks = slot === "ict" ? ICT_FULL_MARKS : SCIENCE_FULL_MARKS;

    if (!applicable) {
      const raw = row?.marks ?? row?.marksObtained ?? source?.marks ?? 0;
      const total = absent ? 0 : Math.max(0, Math.min(fullMarks, Number(raw) || 0));
      return { ...row, marks: total, fullMarks, isAbsent: absent };
    }

    const rawExam = row?.examMark ?? row?.marks ?? row?.marksObtained ?? row?.ictExamMark;
    const computed = computePractical(slot, group, className, absent ? null : rawExam, absent);
    return {
      ...row,
      marks: computed.total,
      examMark: computed.exam,
      ...(slot === "ict" ? { ictExamMark: computed.exam } : {}),
      fullMarks: computed.fullMarks,
      isAbsent: absent,
    };
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
  const group = getStudentGroup(studentInfo.stdRegNo);
  const normalizedResults = normalizePracticalResultRows({
    rows: Array.isArray(results) ? results : [],
    className: studentInfo.stdClass?.className,
    group,
    createdAt: new Date(), // new result
  });
  // Validate practical subjects. Server computes expected total once.
  for (const r of normalizedResults) {
    const slot = getPracticalSubjectSlot(r.subjectName, group, studentInfo.stdClass?.className);
    if (!slot) continue;
    const absent = !!r.isAbsent;
    const total = Number(r.marks) || 0;
    const fullMarks = slot === "ict" ? ICT_FULL_MARKS : SCIENCE_FULL_MARKS;
    const applicable = isPracticalApplicable(r.subjectName, group, studentInfo.stdClass?.className, new Date());
    if (applicable) {
      const exam = Number(r.examMark ?? r.ictExamMark ?? getPracticalExamFromStoredTotal(r.subjectName, group, studentInfo.stdClass?.className, total, absent) ?? 0);
      if (absent) {
        if (total !== 0) throw new AppError(400, `${r.subjectName}: absent must have 0 marks`);
      } else {
        const maxExam = slot === "ict" ? ICT_EXAM_MAX : SCIENCE_EXAM_MAX;
        if (exam < 0 || exam > maxExam) throw new AppError(400, `${r.subjectName}: exam mark must be between 0 and ${maxExam}`);
        const expected = computePractical(slot, group, studentInfo.stdClass?.className, exam, false);
        if (total !== expected.total) throw new AppError(400, `${r.subjectName}: total must be ${expected.total} for exam ${exam}`);
      }
    } else if (total < 0 || total > fullMarks) {
      throw new AppError(400, `${r.subjectName}: marks must be between 0 and ${fullMarks}`);
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
      ictPracticalAdded: isMonthlyResultNewForPractical(new Date()) ? true : !!(payload as any).ictPracticalAdded,

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
          ...(r.examMark !== undefined ? { examMark: Number(r.examMark) } : {}),
          ...(r.ictExamMark !== undefined ? { ictExamMark: Number(r.ictExamMark) } : {}),
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
  const group = getStudentGroup(existing.student?.stdRegNo);
  const isOldClass910Result =
    !isMonthlyResultNewForPractical(existing.createdAt) && /(9|10)/.test(String(className ?? ""));
  const existingIctPracticalAdded = !!(existing as any).ictPracticalAdded;
  const requestedPracticalAdd = !!ictPracticalAdded && !existingIctPracticalAdded;
  if (requestedPracticalAdd && !isOldClass910Result) {
    throw new AppError(400, "Practical can only be added for old class 9/10 results");
  }

  // Handle old-result manual practical add before normalization. Only rows whose incoming
  // total matches the expected "add practical" delta are treated as add requests; others pass through.
  let preparedResults = Array.isArray(results) ? [...results] : null;
  let practicalAddApplied = false;
  if (requestedPracticalAdd && Array.isArray(preparedResults)) {
    for (const row of preparedResults) {
      const source = row?.id ? (existing.results || []).find((r: any) => r.id === row.id) : null;
      const subjectName = String(row?.subjectName ?? source?.subjectName ?? "").trim();
      const slot = getPracticalSubjectSlot(subjectName, group, className);
      if (!slot || !source) continue;
      const sourceTotal = Number(source.marks) || 0;
      const incomingTotal = Number(row?.marks ?? row?.marksObtained ?? sourceTotal) || 0;
      const absent = !!row?.isAbsent || isSubjectAbsent(source);
      const isAddRequest =
        slot === "ict"
          ? incomingTotal === sourceTotal * 2 && incomingTotal !== sourceTotal
          : slot.startsWith("science-") && group === "Science"
            ? incomingTotal === sourceTotal + SCIENCE_PRACTICAL_ADDED && incomingTotal !== sourceTotal
            : false;
      if (!isAddRequest) continue;
      if (existingIctPracticalAdded) throw new AppError(400, `${subjectName}: practical already added`);
      if (absent) throw new AppError(400, `${subjectName}: cannot add practical for absent subject`);
      if (slot === "ict") {
        if (sourceTotal < ICT_EXAM_PASS_MARK || sourceTotal > ICT_EXAM_MAX) throw new AppError(400, "ICT: practical can be added only when marks are between 9 and 25");
        row.examMark = sourceTotal;
        row.ictExamMark = sourceTotal;
      } else {
        if (sourceTotal < SCIENCE_EXAM_PASS_MARK || sourceTotal > SCIENCE_EXAM_MAX) throw new AppError(400, `${subjectName}: practical can be added only when exam marks are between 25 and 75`);
        row.examMark = sourceTotal;
      }
      practicalAddApplied = true;
    }
  }

  const normalizedIncoming = Array.isArray(preparedResults)
    ? normalizePracticalResultRows({
        rows: preparedResults,
        className,
        group,
        createdAt: existing.createdAt,
        existingRows: existing.results || [],
      })
    : null;
  if (Array.isArray(normalizedIncoming)) {
    for (const r of normalizedIncoming) {
      const slot = getPracticalSubjectSlot(r.subjectName, group, className);
      if (!slot) continue;
      const absent = !!r.isAbsent;
      const total = Number(r.marks) || 0;
      const fullMarks = slot === "ict" ? ICT_FULL_MARKS : SCIENCE_FULL_MARKS;
      const applicable = isPracticalApplicable(r.subjectName, group, className, existing.createdAt);
      if (applicable) {
        const exam = Number(r.examMark ?? r.ictExamMark ?? getPracticalExamFromStoredTotal(r.subjectName, group, className, total, absent) ?? 0);
        if (absent) {
          if (total !== 0) throw new AppError(400, `${r.subjectName}: absent must have 0 marks`);
        } else {
          const maxExam = slot === "ict" ? ICT_EXAM_MAX : SCIENCE_EXAM_MAX;
          if (exam < 0 || exam > maxExam) throw new AppError(400, `${r.subjectName}: exam mark must be between 0 and ${maxExam}`);
          const expected = computePractical(slot, group, className, exam, false);
          if (total !== expected.total) throw new AppError(400, `${r.subjectName}: total must be ${expected.total} for exam ${exam}`);
        }
      } else if (total < 0 || total > fullMarks) {
        throw new AppError(400, `${r.subjectName}: marks must be between 0 and ${fullMarks}`);
      }
    }
  }  const nextIctPracticalAdded = existingIctPracticalAdded || practicalAddApplied || isMonthlyResultNewForPractical(existing.createdAt);

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
          ...(result.examMark !== undefined ? { examMark: Number(result.examMark) } : {}),
          ...(result.ictExamMark !== undefined ? { ictExamMark: Number(result.ictExamMark) } : {}),
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
