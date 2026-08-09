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

  // Check if record with same student, subject, week, year, and batch already exists
  // This matches the unique constraint: @@unique([studentId, subjectId, week, year])
  const existing = await prisma.weeklyMarksSheet.findFirst({
    where: {
      studentId: studentId || null,
      subjectId,
      week,
      year: payload.year,
      stdClassId: finalStdClassId,
      batchId: batchId || null,
    },
  });

  if (existing) {
    throw new Error("Record with same student, subject, week, year, and batch already exists");
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

// Get all weekly marks sheets for a specific student
export const getWeeklyMarksSheetsByStudent = async (studentId: string) => {
  return prisma.weeklyMarksSheet.findMany({
    where: {
      studentId: studentId,
    },
    include: {
      stdClass: true,
      subject: true,
      batch: true,
      student: true,
    },
    orderBy: {
      createdAt: 'desc',
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
  batchId?: string;
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
  // First, try to find existing record
  const existing = await prisma.weeklyMarksSheet.findFirst({
    where: {
      studentId: payload.studentId,
      subjectId: payload.subjectId,
      week: payload.week,
      year: payload.year,
      stdClassId: payload.stdClassId,
      batchId: payload.batchId || null,
    },
  });

  if (existing) {
    // Update existing record
    return prisma.weeklyMarksSheet.update({
      where: { id: existing.id },
      data: {
        obtainedMarks: Number(payload.obtainedMarks),
        totalMarks: Number(payload.totalMarks),
        month: payload.month,
        publishedDate: payload.publishedDate,
      },
    });
  } else {
    // Create new record
    return prisma.weeklyMarksSheet.create({
      data: {
        studentId: payload.studentId,
        subjectId: payload.subjectId,
        week: payload.week,
        year: payload.year,
        month: payload.month,
        publishedDate: payload.publishedDate,
        stdClassId: payload.stdClassId,
        batchId: payload.batchId || null,
        totalMarks: Number(payload.totalMarks),
        obtainedMarks: Number(payload.obtainedMarks),
      },
    });
  }
};

// Bulk upsert multiple student marks at once
export const bulkUpsertStudentMarks = async (payload: {
  marks: Array<{
    studentId: string;
    subjectId: string;
    week: string;
    year: string;
    month: string;
    publishedDate: string;
    stdClassId: string;
    batchId?: string;
    totalMarks: number;
    obtainedMarks: number;
  }>;
}) => {
  if (!payload.marks || !Array.isArray(payload.marks) || payload.marks.length === 0) {
    throw new Error("Marks array is required and must not be empty");
  }

  const results = [];
  
  // Process each mark entry
  for (const mark of payload.marks) {
    try {
      const result = await upsertStudentObtainedMarks(mark);
      results.push(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Error processing mark for student ${mark.studentId}:`, errorMessage);
      // Continue processing other marks even if one fails
      results.push({ error: errorMessage, studentId: mark.studentId });
    }
  }

  return {
    success: true,
    totalProcessed: results.length,
    results,
  };
};
