import prisma from '../../../db/db.config';
import { builderQuery } from '../../builders/prismaBuilderQuery';

const create = async (payload: any) => {
  return prisma.subject.create({
    data: {
      ...payload,
    },
  });
};

const getAll = async (query: Record<string, any>) => {
  const subjectQuery = builderQuery({
    searchFields: ['subjectName'],
    searchTerm: query.searchTerm,
    filter: query.filter ? JSON.parse(query.filter) : {},
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : { createdAt: 'desc' },
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
  });

  const totalSubjects = await prisma.subject.count({
    where: subjectQuery.where,
  });
  const currentPage = Number(query.page) || 1;
  const totalPages = Math.ceil(totalSubjects / subjectQuery.take);
  const response = await prisma.subject.findMany({
    ...subjectQuery,
    include: {
      stdClass: true,
    },
  });

  return {
    meta: {
      totalItems: totalSubjects,
      totalPages,
      currentPage,
    },
    data: response,
  };
};

const getById = async (id: string) => {
  return prisma.subject.findUniqueOrThrow({
    where: { id },
    include: {
      stdClass: true,
    },
  });
};

const update = async (id: string, payload: any) => {
  await prisma.subject.findUniqueOrThrow({
    where: { id },
  });
  return prisma.subject.update({
    where: { id },
    data: {
      subjectName: payload.subjectName,
      classId: payload.classId,
    },
  });
};

const deleteSubject = async (id: string) => {
  await prisma.subject.findUniqueOrThrow({
    where: { id },
  });
  return prisma.subject.delete({ where: { id } });
};

export const subjectService = {
  create,
  getAll,
  getById,
  update,
  delete: deleteSubject,
};
