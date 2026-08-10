import prisma from "../../../db/db.config";
import { builderQuery } from "../../builders/prismaBuilderQuery";

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

  // Get student's class & batch automatically
  const student = await prisma.student.findUniqueOrThrow({
    where: {
      id: studentId,
    },
    select: {
      classId: true,
      batchId: true,
    },
  });

  return prisma.monthlyExamResult.create({
    data: {
      ...restPayload,

      student: {
        connect: {
          id: studentId,
        },
      },

      stdClass: {
        connect: {
          id: student.classId,
        },
      },

      ...(student.batchId && {
        batch: {
          connect: {
            id: student.batchId,
          },
        },
      }),

      results: {
        create: results,
      },
    },

    include: {
      student: true,
      batch: true,
      results: true,
    },
  });
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

  // stdRegNo / parentPhone / name are NOT columns on MonthlyExamResult itself —
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
    // searchFields intentionally left empty — search is handled above via searchCondition
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
  return prisma.monthlyExamResult.findUnique({
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
};

/**
 * Update Monthly Result
 */
const update = async (id: string, payload: any) => {
  // Destructure results from payload if present
  const { results, ...restPayload } = payload;

  // Prepare the update object for results if provided
  let resultsUpdate = undefined;
  if (Array.isArray(results)) {
    resultsUpdate = {
      update: results.map((result: any) => ({
        where: { id: result.id },
        data: {
          marks: result.marks,
          fullMarks: result.fullMarks,
          highestMark: result.highestMark,
          point: result.point,
          grade: result.grade,
        },
      })),
    };
  }

  return prisma.monthlyExamResult.update({
    where: { id },
    data: {
      ...restPayload,
      ...(resultsUpdate && { results: resultsUpdate }),
    },
    include: {
      student: true,
      results: true,
    },
  });
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

  // সেই ক্লাসের (ও প্রয়োজনে সেই মাসের) সব রেজাল্ট — pagination ছাড়া
  const allResults = await prisma.monthlyExamResult.findMany({
    where,
    include: {
      student: true,
      results: true,
    },
  });

  if (allResults.length === 0) {
    return { classId, month: month || null, totalStudents: 0, updated: [] };
  }

  const getAchievedMarks = (results: { marks: number }[]) =>
    results.reduce((sum, r) => sum + r.marks, 0);

  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  // Achieved marks অনুযায়ী descending sort
  const sorted = [...allResults].sort(
    (a, b) => getAchievedMarks(b.results) - getAchievedMarks(a.results),
  );

  // সব আপডেট একটা transaction-এ — atomic (সব হবে, নয়তো কিছুই হবে না)
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
  calculatePositionsByClass, // 👈 যোগ করুন
};
