import prisma from '../../../db/db.config';
import { builderQuery } from '../../builders/prismaBuilderQuery';

const create = async (payload: any) => {
  const existingStudent = await prisma.student.findUnique({
    where: { stdRegNo: payload.stdRegNo },
  });

  if (existingStudent) {
    throw new Error(`A student with stdRegNo "${payload.stdRegNo}" already exists`);
  }

  return prisma.student.create({
    data: {
      ...payload,
    },
  });
};

const getAll = async (query: Record<string, any>) => {
  const studentQuery = builderQuery({
    searchFields: ['name', 'parentPhone', 'address'],
    searchTerm: query.searchTerm,
    filter: query.filter ? JSON.parse(query.filter) : {},
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : { createdAt: 'desc' },
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
  });

  const totalStudents = await prisma.student.count({
    where: studentQuery.where,
  });
  const currentPage = Number(query.page) || 1;
  const totalPages = Math.ceil(totalStudents / studentQuery.take);
  const response = await prisma.student.findMany({
    ...studentQuery,
    include: {
      stdClass: true,
      section: true,
      weeklyMarksSheets: true,
      monthlyExamResults: true,
    },
  });

  return {
    meta: {
      totalItems: totalStudents,
      totalPages,
      currentPage,
    },
    data: response,
  };
};

const getById = async (id: string) => {
  return prisma.student.findUniqueOrThrow({
    where: { id },
    include: {
      stdClass: true,
      section: true,
      weeklyMarksSheets: true,
      monthlyExamResults: true,
    },
  });
};

const update = async (id: string, payload: any) => {
  await prisma.student.findUniqueOrThrow({
    where: { id },
  });
  return prisma.student.update({
    where: { id },
    data: {
      name: payload.name,
      classId: payload.classId,
      sectionId: payload.sectionId,
      parentPhone: payload.parentPhone,
      address: payload.address,
      gender: payload.gender,
      stdRegNo: payload.stdRegNo,
    },
  });
};

const deleteStudent = async (id: string) => {
  await prisma.student.findUniqueOrThrow({
    where: { id },
  });
  return prisma.student.delete({ where: { id } });
};

export const studentService = {
  create,
  getAll,
  getById,
  update,
  delete: deleteStudent,
};
