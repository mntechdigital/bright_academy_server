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
    data: { ...payload },
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
      name: payload.name,
      classId: payload.classId,
      sectionId: payload.sectionId,
      parentPhone: payload.parentPhone,
      address: payload.address,
      gender: payload.gender,
      stdRegNo: payload.stdRegNo,
      password: payload.password, // ✅ যোগ করুন
    },
  });
};

// Login service ✅ নতুন
const login = async (payload: { userId: string; password: string }) => {
  const student = await prisma.student.findFirst({
    where: { stdRegNo: payload.userId },
    include: {
      stdClass: true,
      section: true,
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
  login, // ✅
  getMyResults, // ✅
};
