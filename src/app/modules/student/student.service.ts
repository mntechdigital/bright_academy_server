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
  const studentQuery = builderQuery({
    searchFields: ["name", "parentPhone", "address", "stdRegNo"],
    searchTerm: query.searchTerm,
    filter: query.filter ? JSON.parse(query.filter) : {},
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : { createdAt: "desc" },
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

const getMeritPosition = async ({
  classId,
  week,
  month,
  year,
  studentId,
}: {
  classId: string;
  week: string;
  month: string;
  year: string;
  studentId: string;
}) => {
  console.log('🔥 SERVICE CALLED 🔥');

  // Normalize week (Week 1 / Week-1 => 1)
  const requestedWeek = week.replace(/Week[- ]?/i, '').trim();

  const marks = await prisma.weeklyMarksSheet.findMany({
    where: {
      stdClassId: classId,
      month,
      year,
    },
    select: {
      studentId: true,
      obtainedMarks: true,
      week: true,
    },
  });

  // Filter requested week
  const filteredMarks = marks.filter((m) => {
    const dbWeek = m.week.replace(/Week[- ]?/i, '').trim();
    return dbWeek === requestedWeek;
  });

  // Calculate totals
  const totalMap: Record<string, number> = {};

  filteredMarks.forEach((mark) => {
    if (mark.studentId && mark.obtainedMarks !== null) {
      totalMap[mark.studentId] =
        (totalMap[mark.studentId] || 0) + mark.obtainedMarks;
    }
  });

  // Create array
  const totals = Object.entries(totalMap).map(([id, total]) => ({
    studentId: id,
    totalMarks: total,
  }));

  // Sort descending
  totals.sort((a, b) => b.totalMarks - a.totalMarks);

  // Assign rank
  const ranked = totals.map((item, index) => ({
    ...item,
    position: index + 1,
  }));

  const studentRank = ranked.find((r) => r.studentId === studentId);

  console.log('RANKED:', ranked);
  console.log('FOUND RANK:', studentRank);

  return studentRank || null;
};


export const studentService = {
  create,
  getAll,
  getById,
  update,
  delete: deleteStudent,
  login, // ✅
  getMyResults, // ✅
  getMeritPosition
};
