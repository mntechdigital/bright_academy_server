import prisma from '../../../db/db.config';
import { builderQuery } from '../../builders/prismaBuilderQuery';
import AppError from '../../errors/AppError';

const create = async (payload: any) => {
  // Verify that the class exists before creating the subject
  const classExists = await prisma.stdClass.findUnique({
    where: { id: payload.classId },
  });

  if (!classExists) {
    throw new AppError(404, `Class with ID ${payload.classId} does not exist`);
  }

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

  // If classId is being updated, verify that the new class exists
  if (payload.classId) {
    const classExists = await prisma.stdClass.findUnique({
      where: { id: payload.classId },
    });

    if (!classExists) {
      throw new AppError(404, `Class with ID ${payload.classId} does not exist`);
    }
  }

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
