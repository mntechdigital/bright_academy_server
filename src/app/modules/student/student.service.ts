import prisma from "../../../db/db.config";
import { builderQuery } from "../../builders/prismaBuilderQuery";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import configs from "../../configs";

const create = async (payload: any) => {
  const existingStudent = await prisma.student.findFirst({
    where: { stdRegNo: payload.stdRegNo },
  });

  if (existingStudent) {
    throw new Error(
      `A student with stdRegNo "${payload.stdRegNo}" already exists`,
    );
  }

  // password থাকলে hash করুন ✅
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 10);
  }

  return prisma.student.create({
    data: payload,
  });
};

const update = async (id: string, payload: any) => {
  await prisma.student.findUniqueOrThrow({ where: { id } });

  if (payload.stdRegNo) {
    const existingStudent = await prisma.student.findFirst({
      where: {
        stdRegNo: payload.stdRegNo,
        id: { not: id },
      },
    });

    if (existingStudent) {
      throw new Error("Registration number already exists");
    }

    payload.password = payload.stdRegNo;
  }

  // password update করলে নতুন hash করুন ✅
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 10);
  }

  return prisma.student.update({
    where: { id },
    data: {
      ...payload,
    },
  });
};

// Login service ✅ নতুন
const login = async (payload: { userId: string; password: string }) => {
  const student = await prisma.student.findFirst({
    where: { stdRegNo: payload.userId },
    include: {
      stdClass: true,
    },
  });

  if (!student) {
    throw new Error("Student পাওয়া যায়নি");
  }

  if (!student.password) {
    throw new Error("এই Student-এর password এখনো set করা হয়নি");
  }

  const isMatch = await bcrypt.compare(payload.password, student.password);
  if (!isMatch) {
    throw new Error("Password ভুল");
  }

  const token = jwt.sign(
    { studentId: student.id }, // ✅ studentId দিন
    configs.jwtAccessSecret as string, // ✅ আপনার existing configs ব্যবহার করুন
    { expiresIn: "7d" },
  );

  // password বাদ দিয়ে return করুন
  const { password, ...studentWithoutPassword } = student;

  return { token, student: studentWithoutPassword };
};

// নিজের result দেখার service ✅
const getMyResults = async (studentId: string) => {
  const monthlyResults = await prisma.monthlyExamResult.findMany({
    where: { studentId },
    include: { results: true },
    orderBy: { createdAt: "desc" },
  });

  const weeklyMarks = await prisma.weeklyMarksSheet.findMany({
    where: { studentId },
    include: { subject: true },
    orderBy: { createdAt: "desc" },
  });

  return { monthlyResults, weeklyMarks };
};



const getAll = async (query: Record<string, any>) => {
  // Support both:
  //  - URL-driven direct params: ?class=class-7&batch=B-4&gender=Female (and also ?classId=&batchId=)
  //  - Legacy filter JSON: ?filter={"classId":"...","batchId":"...","gender":"Female"}
  // Ensure params are not silently stripped: controller logs req.query, service logs normalizedFilter
  console.log("[studentService.getAll] incoming query:", query);
  const parsedFilter: Record<string, any> = query.filter
    ? JSON.parse(query.filter)
    : {};

  const classParam =
    query.class ?? query.classId ?? parsedFilter.class ?? parsedFilter.classId ?? parsedFilter.className;
  const batchParam =
    query.batch ?? query.batchId ?? parsedFilter.batch ?? parsedFilter.batchId ?? parsedFilter.batchName;
  const genderParam = query.gender ?? parsedFilter.gender;

  // Normalized filter that will be passed to builderQuery
  const normalizedFilter: Record<string, any> = { ...parsedFilter };
  // Remove ambiguous raw keys — we re-add them normalized below
  delete normalizedFilter.class;
  delete normalizedFilter.classId;
  delete normalizedFilter.className;
  delete normalizedFilter.batch;
  delete normalizedFilter.batchId;
  delete normalizedFilter.batchName;
  delete normalizedFilter.gender;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (classParam) {
    if (uuidRegex.test(classParam)) {
      normalizedFilter.classId = classParam;
    } else {
      // classParam is a className like "class-7" — filter via relation
      // Use case-insensitive equals to avoid mismatch (class-7 vs Class-7)
      normalizedFilter.stdClass = { className: { equals: classParam, mode: "insensitive" } };
    }
  }

  if (batchParam) {
    if (uuidRegex.test(batchParam)) {
      normalizedFilter.batchId = batchParam;
    } else {
      // batchParam is a batch name like "B-4" — filter via relation, case-insensitive
      normalizedFilter.batch = { name: { equals: batchParam, mode: "insensitive" } };
    }
  }

  if (genderParam && genderParam !== "All" && genderParam !== "") {
    // gender stored as "Male"/"Female" — use insensitive equals for robustness
    normalizedFilter.gender = { equals: genderParam, mode: "insensitive" };
  }

  // search may come as ?search= or ?searchTerm= — combine with filters via AND
  const searchTerm = query.searchTerm ?? query.search ?? "";

  const studentQuery = builderQuery({
    searchFields: ["name", "parentPhone", "address", "stdRegNo"],
    searchTerm,
    filter: normalizedFilter,
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : { createdAt: "desc" },
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
  });

  console.log("[studentService.getAll] normalizedFilter:", normalizedFilter);
  console.log("[studentService.getAll] where clause:", JSON.stringify(studentQuery.where, null, 2));

  // CRITICAL: count must use SAME where as findMany — otherwise Total Students / pagination stays unfiltered (514 / 52 pages)
  const whereForCount = studentQuery.where;
  const totalStudents = await prisma.student.count({
    where: whereForCount,
  });
  const currentPage = Number(query.page) || 1;
  const totalPages = Math.ceil(totalStudents / studentQuery.take);
  const response = await prisma.student.findMany({
    ...studentQuery,
    // ensure where is not overwritten — explicitly reuse whereForCount
    where: whereForCount,
    include: {
      stdClass: true,
      batch: true,
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
  return prisma.student.findUnique({
    where: { id },
    include: {
      stdClass: true,
      batch: true,
      weeklyMarksSheets: true,
      monthlyExamResults: true,
    },
  });
};

const deleteStudent = async (id: string) => {
  await prisma.student.findUniqueOrThrow({
    where: { id },
  });

  // First delete related records to avoid foreign key constraint violation
  await prisma.weeklyMarksSheet.deleteMany({ where: { studentId: id } });
  // MonthlyExamResult has cascade to SubjectResult, so delete it directly
  await prisma.monthlyExamResult.deleteMany({ where: { studentId: id } });

  return prisma.student.delete({ where: { id } });
};

export const studentService = {
  create,
  getAll,
  getById,
  update,
  delete: deleteStudent,
  login, // ✅
  getMyResults, // ✅
};
