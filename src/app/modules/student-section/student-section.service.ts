import prisma from '../../../db/db.config';
import { builderQuery } from '../../builders/prismaBuilderQuery';

const getAll = async (query: Record<string, any>) => {
  const studentSectionQuery = builderQuery({
    searchFields: ['sectionName'],
    searchTerm: query.searchTerm,
    filter: query.filter ? JSON.parse(query.filter) : {},
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : { createdAt: 'asc' },
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
      classes: true,
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
      classes: true,
      students: true,
    },
  });
};

export const studentSectionService = {
  getAll,
  getById,
};
