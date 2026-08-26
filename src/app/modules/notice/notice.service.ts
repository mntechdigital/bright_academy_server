import prisma from '../../../db/db.config';
import { builderQuery } from '../../builders/prismaBuilderQuery';

const create = async (payload: any) => {
  return prisma.notice.create({
    data: {
      ...payload,
    },
  });
};

const getAll = async (query: Record<string, any>) => {
  const noticeQuery = builderQuery({
    searchFields: ['title'],
    searchTerm: query.searchTerm,
    filter: query.filter ? JSON.parse(query.filter) : {},
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : { createdAt: 'desc' },
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
  });

  const totalNotices = await prisma.notice.count({
    where: noticeQuery.where,
  });
  const currentPage = Number(query.page) || 1;
  const totalPages = Math.ceil(totalNotices / noticeQuery.take);
  const response = await prisma.notice.findMany({
    ...noticeQuery,
  });

  return {
    meta: {
      totalItems: totalNotices,
      totalPages,
      currentPage,
    },
    data: response,
  };
};

const getPublishedNotices = async (query: Record<string, any>) => {
  const noticeQuery = builderQuery({
    searchFields: ['title'],
    searchTerm: query.searchTerm,
    filter: {
      ...((query.filter ? JSON.parse(query.filter) : {})),
      isPublished: true,
    },
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : { createdAt: 'desc' },
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
  });

  const totalNotices = await prisma.notice.count({
    where: noticeQuery.where,
  });
  const currentPage = Number(query.page) || 1;
  const totalPages = Math.ceil(totalNotices / noticeQuery.take);
  const response = await prisma.notice.findMany({
    ...noticeQuery,
  });

  return {
    meta: {
      totalItems: totalNotices,
      totalPages,
      currentPage,
    },
    data: response,
  };
};

const getById = async (id: string) => {
  return prisma.notice.findUniqueOrThrow({
    where: { id },
  });
};

const update = async (id: string, payload: any) => {
  await prisma.notice.findUniqueOrThrow({
    where: { id },
  });

  return prisma.notice.update({
    where: { id },
    data: {
      ...payload,
    },
  });
};

const deleteNotice = async (id: string) => {
  await prisma.notice.findUniqueOrThrow({
    where: { id },
  });
  return prisma.notice.delete({ where: { id } });
};

export const noticeService = {
  create,
  getAll,
  getPublishedNotices,
  getById,
  update,
  delete: deleteNotice,
};
