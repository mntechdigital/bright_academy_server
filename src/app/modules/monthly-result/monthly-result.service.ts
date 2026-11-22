import prisma from "../../../db/db.config";
import { builderQuery } from "../../builders/prismaBuilderQuery";
import {
  orderedSubjectsForClass,
  sortRowsBySubjectOrder,
} from "../subject/subject.util";
import {
  computeAndApplyMonthlySummary,
  getStudentGroup,
  computeMonthlyResultSummary,
  ICT_PRACTICAL_CUTOFF,
  ICT_EXAM_MAX,
  ICT_PRACTICAL_MARKS,
  ICT_FULL_MARKS,
  getIctExamFromStoredTotal,
  getIctStoredTotalFromExam,
  isIctPracticalApplicable,
  isIctSubject,
  isMonthlyResultNewForIct,
  isSubjectAbsent,
} from "../../utils/monthlyResultSummary";

// Contract: client sends ICT exam mark (0-25) for NEW class 9/10 monthly results.
// Server adds ICT_PRACTICAL_MARKS (25) and stores total marksObtained (25-50, or 0 if absent).
// For OLD results or non-applicable ICT rows, client sends/stores total marks as before.
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

    // New class 9/10 ICT: client sends exam mark (max 25). Server stores exam+25.
    const rawExam = row?.marks ?? row?.marksObtained ?? row?.examMarks;
    const exam = absent ? null : Math.max(0, Math.min(ICT_EXAM_MAX, Number(rawExam) || 0));
    const total = getIctStoredTotalFromExam(exam, absent);
    return { ...row, marks: total, fullMarks: ICT_FULL_MARKS, isAbsent: absent };
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
    throw new Error(
      "Monthly result already exists for this student in this month"
    );
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
  // Validate ICT: for NEW class 9/10, exam mark sent by client must be 0-25; stored total becomes 25-50, or 0 if absent.
  for (const r of normalizedResults) {
    if (!isIctSubject(r.subjectName)) continue;
    const ictApplicable = isIctPracticalApplicable(studentInfo.stdClass?.className, new Date());
    const absent = !!r.isAbsent;
    const total = Number(r.marks) || 0;
    if (ictApplicable) {
      if (absent) {
        if (total !== 0) throw new Error("Absent ICT must have 0 marks");
      } else if (total < ICT_PRACTICAL_MARKS || total > ICT_FULL_MARKS) {
        throw new Error("ICT total must be 25-50 for new class 9/10 unless absent");
      }
    } else {
      if (total < 0 || total > ICT_FULL_MARKS) throw new Error("ICT marks must be between 0 and 50");
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

  // batchId is pulled out and handled separately: some older MonthlyExamResult
  // rows have a null batchId even though the student has one, so a plain
  // `batchId: value` equality filter misses them. We instead match either the
  // exam record's own batchId OR the related student's batchId.
  const { batchId, ...restFilter } = parsedFilter;

  const searchTerm: string = query.searchTerm || "";

  // stdRegNo / parentPhone / name are NOT columns on MonthlyExamResult itself ï¿½?"
  // they live on the related Student model. Passing them into builderQuery's
  // flat searchFields produced an invalid Prisma query (silently failing to
  // "no results"). We build the nested search condition manually instead.
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

  const monthlyResultQuery = builderQuery({
    // searchFields intentionally left empty ï¿½?" search is handled above via searchCondition
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

  // Sort each result's subject rows by its own class subject list (rows with
  // unknown subjects go last, sorted by name). Fetch subjects once per distinct class.
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
  if (!existing) throw new Error("Monthly result not found");

  // Destructure results from payload if present
  const { results, ictPracticalAdded, ...restPayload } = payload;

  const className = existing.student?.stdClass?.className;
  const isOldClass910Result = !isMonthlyResultNewForIct(existing.createdAt) && /(9|10)/.test(String(className ?? ""));
  const existingIct = (existing.results || []).find((r: any) => isIctSubject(r.subjectName));
  const incomingIct = Array.isArray(results) ? results.find((r: any) => isIctSubject(r.subjectName) || (existingIct && r.id === existingIct.id)) : null;
  const existingIctPracticalAdded = !!(existing as any).ictPracticalAdded;
  const requestedPracticalAdd = !!ictPracticalAdded && !existingIctPracticalAdded;
  if (requestedPracticalAdd) {
    if (!isOldClass910Result) throw new Error("ICT practical can only be added for old class 9/10 results");
    if (!existingIct) throw new Error("ICT subject not found");
    const existingAbsent = isSubjectAbsent(existingIct);
    const existingTotal = Number(existingIct.marks) || 0;
    if (existingAbsent) throw new Error("Cannot add practical for absent ICT");
    if (existingTotal > ICT_EXAM_MAX) throw new Error("ICT marks already above 25; practical may already be included");
    if (incomingIct) {
      const incomingTotal = Number(incomingIct.marks ?? incomingIct.marksObtained ?? 0) || 0;
      if (incomingTotal !== existingTotal + ICT_PRACTICAL_MARKS) {
        throw new Error("ICT practical add must increase stored marks by exactly 25");
      }
      if (isSubjectAbsent(incomingIct)) throw new Error("Cannot add practical for absent ICT");
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
      if (ictApplicable) {
        if (absent) { if (total !== 0) throw new Error("Absent ICT must have 0 marks"); }
        else if (total < ICT_PRACTICAL_MARKS || total > ICT_FULL_MARKS) throw new Error("ICT total must be 25-50 for new class 9/10 unless absent");
      } else if (total < 0 || total > ICT_FULL_MARKS) throw new Error("ICT marks must be between 0 and 50");
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
 * Calculate positions for all students in a class (optionally scoped to a month)
 */
const calculatePositionsByClass = async (classId: string, month?: string) => {
  if (!classId) {
    throw new Error("classId is required to calculate positions");
  }

  const where: any = {
    student: { classId },
  };
  if (month) {
    where.month = month;
  }

  // à¦¸à§‡à¦‡ à¦•à§à¦²à¦¾à¦¸à§‡à¦° (à¦“ à¦ªà§à¦°à¦¯à¦¼à§‹à¦œà¦¨à§‡ à¦¸à§‡à¦‡ à¦®à¦¾à¦¸à§‡à¦°) à¦¸à¦¬ à¦°à§‡à¦œà¦¾à¦²à§à¦Ÿ â€” pagination à¦›à¦¾à¦¡à¦¼à¦¾
  const allResults = await prisma.monthlyExamResult.findMany({
    where,
    include: {
      student: { include: { stdClass: true } },
      results: true,
      stdClass: true,
    },
  });

  if (allResults.length === 0) {
    return { classId, month: month || null, totalStudents: 0, updated: [] };
  }

  const classSubjects = await orderedSubjectsForClass(classId);
  const getAchievedMarks = (result: any) => {
    const classNumber = result.stdClass?.className || result.student?.stdClass?.className;
    const group = getStudentGroup(result.student?.stdRegNo);
    const summary = computeMonthlyResultSummary({
      resultSubjects: result.results || [],
      classSubjects,
      group,
      classNumber,
      fallbackTotalMarks: result.totalMarks,
    });
    return summary.obtained;
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  // Achieved marks à¦…à¦¨à§à¦¯à¦¾à¦¯à¦¼à§€ descending sort
  const sorted = [...allResults].sort(
    (a, b) => getAchievedMarks(b) - getAchievedMarks(a),
  );

  // à¦¸à¦¬ à¦†à¦ªà¦¡à§‡à¦Ÿ à¦à¦•à¦Ÿà¦¾ transaction-à¦ â€” atomic (à¦¸à¦¬ à¦¹à¦¬à§‡, à¦¨à¦¯à¦¼à¦¤à§‹ à¦•à¦¿à¦›à§à¦‡ à¦¹à¦¬à§‡ à¦¨à¦¾)
  const updates = sorted.map((result, index) =>
    prisma.monthlyExamResult.update({
      where: { id: result.id },
      data: { position: `${index + 1}${getOrdinalSuffix(index + 1)}` },
    }),
  );

  await prisma.$transaction(updates);

  return {
    classId,
    month: month || null,
    totalStudents: sorted.length,
    updated: sorted.map((r, i) => ({
      id: r.id,
      studentName: r.student?.name,
      position: `${i + 1}${getOrdinalSuffix(i + 1)}`,
    })),
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
