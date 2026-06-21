
import prisma from "../../db/db.config";
import { builderQuery } from "../builders/prismaBuilderQuery";

const create = async (payload: any) => {
  // একই ক্লাসে একই নামে batch আছে কিনা চেক করুন (schema-র @@unique এর সাথে মিল রেখে)
  const existingBatch = await prisma.batch.findFirst({
    where: { classId: payload.classId, name: payload.name },
  });

  if (existingBatch) {
    throw new Error(
      `এই ক্লাসে "${payload.name}" নামে একটি Batch ইতিমধ্যে আছে`,
    );
  }

  return prisma.batch.create({
    data: { ...payload },
  });
};

const update = async (id: string, payload: any) => {
  const batch = await prisma.batch.findUniqueOrThrow({ where: { id } });

  // নাম বা ক্লাস পরিবর্তন হলে duplicate চেক করুন
  if (payload.name || payload.classId) {
    const existingBatch = await prisma.batch.findFirst({
      where: {
        classId: payload.classId || batch.classId,
        name: payload.name || batch.name,
        NOT: { id },
      },
    });

    if (existingBatch) {
      throw new Error(
        `এই ক্লাসে "${payload.name || batch.name}" নামে একটি Batch ইতিমধ্যে আছে`,
      );
    }
  }

  return prisma.batch.update({
    where: { id },
    data: {
      name: payload.name,
      startTime: payload.startTime,
      endTime: payload.endTime,
      classId: payload.classId,
    },
  });
};

const getAll = async (query: Record<string, any>) => {
  const batchQuery = builderQuery({
    searchFields: ["name"],
    searchTerm: query.searchTerm,
    filter: query.filter ? JSON.parse(query.filter) : {},
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : { createdAt: "desc" },
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
  });

  const totalBatches = await prisma.batch.count({
    where: batchQuery.where,
  });
  const currentPage = Number(query.page) || 1;
  const totalPages = Math.ceil(totalBatches / batchQuery.take);

  const response = await prisma.batch.findMany({
    ...batchQuery,
    include: {
      stdClass: true,
      students: true,
    },
  });

  return {
    meta: {
      totalItems: totalBatches,
      totalPages,
      currentPage,
    },
    data: response,
  };
};

const getById = async (id: string) => {
  return prisma.batch.findUniqueOrThrow({
    where: { id },
    include: {
      stdClass: true,
      students: true,
    },
  });
};

// নির্দিষ্ট ক্লাসের সব batch — frontend dropdown এ "class select করলে batch লোড হবে" এই UX এর জন্য খুবই দরকারি
const getByClassId = async (classId: string) => {
  return prisma.batch.findMany({
    where: { classId },
    orderBy: { startTime: "asc" },
  });
};

const deleteBatch = async (id: string) => {
  await prisma.batch.findUniqueOrThrow({
    where: { id },
  });
  return prisma.batch.delete({ where: { id } });
};

export const batchService = {
  create,
  getAll,
  getById,
  getByClassId,
  update,
  delete: deleteBatch,
};