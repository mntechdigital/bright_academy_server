import bcrypt from 'bcryptjs';
import prisma from '../../../db/db.config';
import { builderQuery } from '../../builders/prismaBuilderQuery';

const getAll = async (query: Record<string, any>) => {
    const teacherQuery = builderQuery({
        searchFields: ['name', 'regNo'],
        searchTerm: query.searchTerm,
        filter: query.filter ? JSON.parse(query.filter) : {},
        orderBy: query.orderBy ? JSON.parse(query.orderBy) : { createdAt: 'desc' },
        page: query.page ? Number(query.page) : 1,
        limit: query.limit ? Number(query.limit) : 10,
    });

    const totalTeachers = await prisma.teacher.count({
        where: teacherQuery.where,
    });
    const currentPage = Number(query.page) || 1;
    const totalPages = Math.ceil(totalTeachers / teacherQuery.take);
    const response = await prisma.teacher.findMany({
        ...teacherQuery,
        select: {
            id: true,
            name: true,
            regNo: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return {
        meta: {
            totalItems: totalTeachers,
            totalPages,
            currentPage,
        },
        data: response,
    };
};

const getById = async (id: string) => {
  return prisma.teacher.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      name: true,
      regNo: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

const update = async (id: string, payload: any) => {
  await prisma.teacher.findUniqueOrThrow({
    where: { id },
  });

  if (payload.regNo) {
    const teacherWithSameRegNo = await prisma.teacher.findFirst({
      where: {
        regNo: payload.regNo,
        NOT: { id },
      },
    });

    if (teacherWithSameRegNo) {
      throw new Error(`A teacher with regNo "${payload.regNo}" already exists`);
    }
  }

  const updatePayload: Record<string, any> = {
    name: payload.name,
    regNo: payload.regNo,
  };

  if (payload.password) {
    updatePayload.password = await bcrypt.hash(payload.password, 10);
  }

  return prisma.teacher.update({
    where: { id },
    data: updatePayload,
    select: {
      id: true,
      name: true,
      regNo: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

const deleteTeacher = async (id: string) => {
  await prisma.teacher.findUniqueOrThrow({
    where: { id },
  });

  return prisma.teacher.delete({
    where: { id },
    select: {
      id: true,
      name: true,
      regNo: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const teacherService = {
  getAll,
  getById,
  update,
  delete: deleteTeacher,
};
