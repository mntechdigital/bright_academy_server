import prisma from '../../../db/db.config';
import { builderQuery } from '../../builders/prismaBuilderQuery';
import AppError from '../../errors/AppError';

const create = async (payload: any) => {
  // Check if class with this name already exists
  const existingClass = await prisma.stdClass.findUnique({
    where: { className: payload.className },
  });

  if (existingClass) {
    throw new AppError(409, `Class "${payload.className}" already exists`);
  }

  // Get all existing sections from database
  const existingSections = await prisma.section.findMany();

  // Create the class and link all existing sections
  const newClass = await prisma.stdClass.create({
    data: {
      className: payload.className,
      sections: {
        connect: existingSections.map((section) => ({ id: section.id })),
      },
    },
    include: {
      sections: true,
    },
  });

  return newClass;
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
      students: true,
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

const getById = async (id: string) => {
  return prisma.stdClass.findUniqueOrThrow({
    where: { id },
    include: {
      subjects: true,
      sections: true,
      students: true,
    },
  });
};

const update = async (id: string, payload: any) => {
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

const deleteStdClass = async (id: string) => {
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
