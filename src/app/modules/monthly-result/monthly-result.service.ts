import prisma from '../../../db/db.config';
import { builderQuery } from '../../builders/prismaBuilderQuery';


/**
 * Create Monthly Result
 */
const create = async (payload: any) => {
  return prisma.monthlyExamResult.create({
    data: {
      ...payload,
    },
    include: {
      student: true,
      results: true,
    },
  });
};


/**
 * Get All Monthly Results
 */
const getAll = async (query: Record<string, any>) => {
  const monthlyResultQuery = builderQuery({
    searchFields: ['studentId'],
    searchTerm: query.searchTerm,
    filter: query.filter ? JSON.parse(query.filter) : {},
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : { createdAt: 'desc' },
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
  });

  const totalMonthlyResults = await prisma.monthlyExamResult.count({
    where: monthlyResultQuery.where,
  });
  const currentPage = Number(query.page) || 1;
  const totalPages = Math.ceil(totalMonthlyResults / monthlyResultQuery.take);
  const response = await prisma.monthlyExamResult.findMany({
    ...monthlyResultQuery,
    include: {
      student: true,
      results: true,
    },
  });

  return {
    meta: {
      totalItems: totalMonthlyResults,
      totalPages,
      currentPage,
    },
    data: response,
  };
};


/**
 * Get Single Monthly Result
 */
const getById = async (id: string) => {
  return prisma.monthlyExamResult.findUnique({
    where: { id },
    include: {
      student: true,
      results: true,
    },
  });
};


/**
 * Update Monthly Result
 */
const update = async (id: string, payload: any) => {
  return prisma.monthlyExamResult.update({
    where: { id },
    data: {
      ...payload,
    },
    include: {
      student: true,
      results: true,
    },
  });
};


/**
 * Delete Monthly Result
 */
const remove = async (id: string) => {
  return prisma.monthlyExamResult.delete({
    where: { id },
  });
};


export const monthlyResultService = {
  create,
  getAll,
  getById,
  update,
  delete: remove,
};