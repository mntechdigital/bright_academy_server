import prisma from "../../../db/db.config";
import { builderQuery } from "../../builders/prismaBuilderQuery";


export const createWeeklyMarksSheet = async (payload: any) => {
  const { classId, stdClassId, sectionId, subjectId, ...rest } = payload;

  // Use classId as stdClassId if provided for compatibility
  const finalStdClassId = stdClassId || classId;

  if (!finalStdClassId || !sectionId || !subjectId) {
    throw new Error("stdClassId (or classId), sectionId, and subjectId are required");
  }

  // Remove stdClassId, sectionId, subjectId from rest if present
  const { stdClassId: _s, sectionId: _sec, subjectId: _sub, ...data } = rest;

  return prisma.weeklyMarksSheet.create({
    data: {
      ...data,
      stdClass: { connect: { id: finalStdClassId } },
      section: { connect: { id: sectionId } },
      subject: { connect: { id: subjectId } },
    },
  });
};

export const getAllWeeklyMarksSheets = async (query: Record<string, any>) => {
    const weeklyMarksSheetQuery = builderQuery({
        searchFields: ['title'], // adjust field as needed
        searchTerm: query.searchTerm,
        filter: query.filter ? JSON.parse(query.filter) : {},
        orderBy: query.orderBy ? JSON.parse(query.orderBy) : { createdAt: 'desc' },
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
            section: true,
            subject: true,
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
      section: true,
      subject: true,
    },
  });
};

export const updateWeeklyMarksSheet = async (id: string, payload: any) => {
  const { classId, stdClassId, sectionId, subjectId, ...rest } = payload;
  const finalStdClassId = stdClassId || classId;
  const updateData: any = { ...rest };
  if (finalStdClassId) updateData.stdClass = { connect: { id: finalStdClassId } };
  if (sectionId) updateData.section = { connect: { id: sectionId } };
  if (subjectId) updateData.subject = { connect: { id: subjectId } };
  return prisma.weeklyMarksSheet.update({
    where: { id },
    data: updateData,
    include: {
      stdClass: true,
      section: true,
      subject: true,
    },
  });
};

export const deleteWeeklyMarksSheet = async (id: string) => {
  return prisma.weeklyMarksSheet.delete({
    where: { id },
  });
};
