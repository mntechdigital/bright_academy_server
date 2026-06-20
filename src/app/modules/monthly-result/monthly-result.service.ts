import prisma from '../../../db/db.config';
import { builderQuery } from '../../builders/prismaBuilderQuery';


/**
 * Create Monthly Result
 */
const create = async (payload: any) => {
  const existingResult = await prisma.monthlyExamResult.findFirst({
    where: {
      studentId: payload.studentId,
      month: payload.month,
    },
  });

  if (existingResult) {
    throw new Error('Monthly result already exists for this student in this month');
  }

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
      student: {
        include: {
          stdClass: true,
        },
      },
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
      student: {
        include: {
          stdClass: true,
        },
      },
      results: true,
    },
  });
};


/**
 * Update Monthly Result
 */
const update = async (id: string, payload: any) => {
  // Destructure results from payload if present
  const { results, ...restPayload } = payload;

  // Prepare the update object for results if provided
  let resultsUpdate = undefined;
  if (Array.isArray(results)) {
    resultsUpdate = {
      update: results.map((result: any) => ({
        where: { id: result.id },
        data: {
          marks: result.marks,
          highestMark: result.highestMark,
        },
      })),
    };
  }

  return prisma.monthlyExamResult.update({
    where: { id },
    data: {
      ...restPayload,
      ...(resultsUpdate && { results: resultsUpdate }),
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