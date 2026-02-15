import prisma from '../../../db/db.config';
import { builderQuery } from '../../builders/prismaBuilderQuery';
import AppError from '../../errors/AppError';

const create = async (payload: any) => {
  // Check if section with this name already exists for this class
  const existingSection = await prisma.section.findFirst({
    where: {
      sectionName: payload.sectionName,
      classId: payload.classId,
    },
  });

  if (existingSection) {
    throw new AppError(409, `Section "${payload.sectionName}" already exists for this class`);
  }

  // Check if both sections "A" and "B" already exist for this class
  const sectionCount = await prisma.section.count({
    where: {
      classId: payload.classId,
    },
  });

  if (sectionCount >= 2) {
    throw new AppError(400, 'Maximum limit reached. Both sections "A" and "B" already exist for this class.');
  }

  return prisma.section.create({
    data: {
      ...payload,
    },
  });
};

const getAll = async (query: Record<string, any>) => {
  const studentSectionQuery = builderQuery({
    searchFields: ['sectionName'],
    searchTerm: query.searchTerm,
    filter: query.filter ? JSON.parse(query.filter) : {},
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : { createdAt: 'desc' },
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
  });

  const totalStudentSections = await prisma.section.count({
    where: studentSectionQuery.where,
  });
  const currentPage = Number(query.page) || 1;
  const totalPages = Math.ceil(totalStudentSections / studentSectionQuery.take);
  const response = await prisma.section.findMany({
    ...studentSectionQuery,
    include: {
      stdClass: true,
      _count: {
        select: { students: true },
      },
    },
  });

  return {
    meta: {
      totalItems: totalStudentSections,
      totalPages,
      currentPage,
    },
    data: response,
  };
};

const getById = async (id: string) => {
  return prisma.section.findUniqueOrThrow({
    where: { id },
    include: {
      stdClass: true,
      students: true,
    },
  });
};

const update = async (id: string, payload: any) => {
  await prisma.section.findUniqueOrThrow({
    where: { id },
  });
  return prisma.section.update({
    where: { id },
    data: {
      sectionName: payload.sectionName,
      classId: payload.classId,
    },
  });
};

const deleteSection = async (id: string) => {
  await prisma.section.findUniqueOrThrow({
    where: { id },
  });
  return prisma.section.delete({ where: { id } });
};

export const studentSectionService = {
  create,
  getAll,
  getById,
  update,
  delete: deleteSection,
};
