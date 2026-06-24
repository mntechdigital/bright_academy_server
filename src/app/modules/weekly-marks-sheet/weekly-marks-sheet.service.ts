import prisma from "../../../db/db.config";
import { builderQuery } from "../../builders/prismaBuilderQuery";

export const createWeeklyMarksSheet = async (payload: any) => {
  const { classId, stdClassId, batchId, subjectId, studentId, month, week, ...rest } = payload;

  const finalStdClassId = stdClassId || classId;

  if (!finalStdClassId || !subjectId || !month || !week) {
    throw new Error(
      "stdClassId (or classId), subjectId, month, and week are required",
    );
  }

  // Check if record with same subject, month, and week already exists
  const existing = await prisma.weeklyMarksSheet.findFirst({
    where: {
      subjectId,
      month,
      week,
      stdClassId: finalStdClassId,
    },
  });

  if (existing) {
    throw new Error("Record with same subject, month, and week already exists");
  }

  return prisma.weeklyMarksSheet.create({
    data: {
      ...rest,
      month,
      week,
      stdClass: { connect: { id: finalStdClassId } },
      subject: { connect: { id: subjectId } },
      ...(batchId && { batch: { connect: { id: batchId } } }),
      ...(studentId && { student: { connect: { id: studentId } } }),
    },
  });
};

export const getAllWeeklyMarksSheets = async (query: Record<string, any>) => {
  const weeklyMarksSheetQuery = builderQuery({
    searchFields: ["title"], // adjust field as needed
    searchTerm: query.searchTerm,
    filter: query.filter ? JSON.parse(query.filter) : {},
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : { createdAt: "desc" },
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
  });

  const totalItems = await prisma.weeklyMarksSheet.count({
    where: weeklyMarksSheetQuery.where,
  });
  const currentPage = Number(query.page) || 1;
  const totalPages = Math.ceil(totalItems / weeklyMarksSheetQuery.take);

  const data = await prisma.weeklyMarksSheet.findMany({
    ...weeklyMarksSheetQuery,
    include: {
      stdClass: true,
      subject: true,
      batch: true,
      student: true,
    },
  });

  return {
    meta: {
      totalItems,
      totalPages,
      currentPage,
    },
    data,
  };
};

export const getWeeklyMarksSheetById = async (id: string) => {
  return prisma.weeklyMarksSheet.findUnique({
    where: { id },
    include: {
      stdClass: true,
      subject: true,
      batch: true,
      student: true,
    },
  });
};

export const updateWeeklyMarksSheet = async (id: string, payload: any) => {
  const { classId, stdClassId, batchId, subjectId, studentId, ...rest } = payload;
  const finalStdClassId = stdClassId || classId;
  const updateData: any = { ...rest };
  if (finalStdClassId)
    updateData.stdClass = { connect: { id: finalStdClassId } };
  if (batchId) updateData.batch = { connect: { id: batchId } };
  if (subjectId) updateData.subject = { connect: { id: subjectId } };
  if (studentId) updateData.student = { connect: { id: studentId } };
  return prisma.weeklyMarksSheet.update({
    where: { id },
    data: updateData,
    include: {
      stdClass: true,
      subject: true,
      batch: true,
      student: true,
    },
  });
};

export const deleteWeeklyMarksSheet = async (id: string) => {
  // Check if record exists first
  const existingRecord = await prisma.weeklyMarksSheet.findUnique({
    where: { id },
  });

  if (!existingRecord) {
    throw new Error("Weekly Marks Sheet not found");
  }

  return prisma.weeklyMarksSheet.delete({
    where: { id },
  });
};

// Delete weekly marks sheets by class, batch, and week
export const deleteWeeklyMarksSheetsByClassAndBatch = async (params: {
  stdClassId: string;
  batchId?: string;
  week: string;
}) => {
  const { stdClassId, batchId, week } = params;
  if (!stdClassId || !week) {
    throw new Error("stdClassId and week are required");
  }
  try {
    console.log("Deleting weekly marks sheets with:", { stdClassId, batchId, week });
    
    // Build where clause - always filter by stdClassId and week
    const whereClause: any = { stdClassId, week };
    
    // If batchId is provided, delete records matching that batchId OR NULL batchId
    // This handles both: records with correct batchId and old records with NULL batchId
    if (batchId && batchId.trim() !== "") {
      whereClause.OR = [
        { batchId: batchId },
        { batchId: null }
      ];
    }
    // If batchId is not provided, delete ALL records for this class + week
    
    // First, check how many records match
    const countResult = await prisma.weeklyMarksSheet.count({
      where: whereClause,
    });
    console.log("Records to delete:", countResult);
    
    const result = await prisma.weeklyMarksSheet.deleteMany({
      where: whereClause,
    });
    console.log("Deleted count:", result.count);
    return result; // { count: number }
  } catch (error) {
    console.error("Error deleting weekly marks sheets:", error);
    throw error;
  }
};

export const upsertStudentObtainedMarks = async (payload: {
  studentId: string;
  subjectId: string;
  week: string;
  year: string;
  month: string;
  publishedDate: string;
  stdClassId: string;
  totalMarks: number;
  obtainedMarks: number;
}) => {
  // Validate required fields
  const requiredFields = [
    "studentId",
    "subjectId",
    "week",
    "year",
    "month",
    "publishedDate",
    "stdClassId",
    "totalMarks",
    "obtainedMarks",
  ];
  for (const field of requiredFields) {
    if (
      payload[field as keyof typeof payload] === undefined ||
      payload[field as keyof typeof payload] === null
    ) {
      throw new Error(`Field "${field}" is required.`);
    }
  }

  // Upsert: update if exists, otherwise create
  return prisma.weeklyMarksSheet.upsert({
    where: {
      studentId_subjectId_week_year: {
        studentId: payload.studentId,
        subjectId: payload.subjectId,
        week: payload.week,
        year: payload.year,
      },
    },
    update: {
      obtainedMarks: Number(payload.obtainedMarks),
      totalMarks: Number(payload.totalMarks),
      month: payload.month,
      publishedDate: payload.publishedDate,
      stdClassId: payload.stdClassId,
    },
    create: {
      studentId: payload.studentId,
      subjectId: payload.subjectId,
      week: payload.week,
      year: payload.year,
      month: payload.month,
      publishedDate: payload.publishedDate,
      stdClassId: payload.stdClassId,
      totalMarks: Number(payload.totalMarks),
      obtainedMarks: Number(payload.obtainedMarks),
    },
  });
};
