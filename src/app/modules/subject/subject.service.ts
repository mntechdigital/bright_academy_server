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

  // Check if subject already exists for this class
  const existingSubject = await prisma.subject.findFirst({
    where: {
      classId: payload.classId,
      subjectName: payload.subjectName,
    },
  });

  if (existingSubject) {
    throw new AppError(400, `Subject '${payload.subjectName}' already exists for this class`);
  }

  // New subjects append to the end of the class's subject list.
  const classSubjectCount = await prisma.subject.count({
    where: { classId: payload.classId },
  });

  return prisma.subject.create({
    data: {
      ...payload,
      sortOrder: classSubjectCount,
    },
  });
};

const getAll = async (query: Record<string, any>) => {
  const subjectQuery = builderQuery({
    searchFields: ['subjectName'],
    searchTerm: query.searchTerm,
    filter: query.filter ? JSON.parse(query.filter) : {},
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : { sortOrder: 'asc' },
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
      ...(payload.sortOrder !== undefined && { sortOrder: payload.sortOrder }),
    },
  });
};

/**
 * Move a subject one position up/down within its class list by swapping
 * sortOrder with the adjacent subject.
 */
const move = async (id: string, direction: 'up' | 'down') => {
  const subject = await prisma.subject.findUniqueOrThrow({ where: { id } });

  const classSubjects = await prisma.subject.findMany({
    where: { classId: subject.classId },
    orderBy: [{ sortOrder: 'asc' }, { subjectName: 'asc' }],
    select: { id: true, sortOrder: true },
  });

  const index = classSubjects.findIndex((s) => s.id === id);
  const swapWith =
    direction === 'up' ? classSubjects[index - 1] : classSubjects[index + 1];

  if (!swapWith) {
    return subject;
  }

  await prisma.$transaction([
    prisma.subject.update({
      where: { id },
      data: { sortOrder: swapWith.sortOrder },
    }),
    prisma.subject.update({
      where: { id: swapWith.id },
      data: { sortOrder: subject.sortOrder },
    }),
  ]);

  return prisma.subject.findUniqueOrThrow({ where: { id } });
};

const deleteSubject = async (id: string) => {
  await prisma.subject.findUniqueOrThrow({
    where: { id },
  });

  const usedInRoutine = await prisma.routineSubject.count({
    where: { subjectId: id },
  });

  if (usedInRoutine > 0) {
    throw new AppError(
      409,
      'This subject is used in an exam routine and cannot be deleted',
    );
  }

  return prisma.subject.delete({ where: { id } });
};

export const subjectService = {
  create,
  getAll,
  getById,
  update,
  move,
  delete: deleteSubject,
};
