import prisma from '../../../db/db.config';
import { builderQuery } from '../../builders/prismaBuilderQuery';

const create = async (payload: any) => {
  return prisma.stdClass.create({
    data: {
      ...payload,
    },
  });
};

const getAll = async (query: Record<string, any>) => {
  const studentClassQuery = builderQuery({
    searchFields: ['className'],
    searchTerm: query.searchTerm,
    filter: query.filter ? JSON.parse(query.filter) : {},
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : { createdAt: 'desc' },
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
  });

  const totalStudentClasses = await prisma.stdClass.count({
    where: studentClassQuery.where,
  });
  const currentPage = Number(query.page) || 1;
  const totalPages = Math.ceil(totalStudentClasses / studentClassQuery.take);
  const response = await prisma.stdClass.findMany({
    ...studentClassQuery,
    include: {
      subjects: true,
      sections: true,
      _count: {
        select: { students: true },
      },
    },
  });

  return {
    meta: {
      totalItems: totalStudentClasses,
      totalPages,
      currentPage,
    },
    data: response,
  };
};

const getById = async (id: number) => {
  return prisma.stdClass.findUniqueOrThrow({
    where: { id },
    include: {
      subjects: true,
      sections: true,
      students: true,
    },
  });
};

const update = async (id: number, payload: any) => {
  await prisma.stdClass.findUniqueOrThrow({
    where: { id },
  });
  return prisma.stdClass.update({
    where: { id },
    data: {
      className: payload.className,
    },
  });
};

const deleteStdClass = async (id: number) => {
  await prisma.stdClass.findUniqueOrThrow({
    where: { id },
  });
  return prisma.stdClass.delete({ where: { id } });
};

export const studentClassService = {
  create,
  getAll,
  getById,
  update,
  delete: deleteStdClass,
};
