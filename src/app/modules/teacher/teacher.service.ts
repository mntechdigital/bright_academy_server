import bcrypt from 'bcryptjs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import prisma from '../../../db/db.config';
import { builderQuery } from '../../builders/prismaBuilderQuery';
import AppError from '../../errors/AppError';
import configs from '../../configs';
import { generateToken } from '../../utils/tokenGenerator';

type TTeacherLogin = {
  regNo: string;
  password: string;
};

const getAll = async (query: Record<string, any>) => {
  const teacherQuery = builderQuery({
    searchFields: ['name', 'regNo'],
    searchTerm: query.searchTerm,
    filter: query.filter ? JSON.parse(query.filter) : {},
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : { regNo: 'asc' },
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
      password: true,
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

// ----------------------------
// নতুন: Teacher Login
// ----------------------------
const login = async (payload: TTeacherLogin) => {
  const existingTeacher = await prisma.teacher.findUnique({
    where: { regNo: payload.regNo },
  });

  if (!existingTeacher) {
    throw new AppError(404, 'Teacher not found with this registration number');
  }

  const isPasswordMatch = await bcrypt.compare(
    payload.password,
    existingTeacher.password,
  );

  if (!isPasswordMatch) {
    throw new AppError(401, 'Password is incorrect');
  }

  const jwtPayload = {
    id: existingTeacher.id,
    regNo: existingTeacher.regNo,
    name: existingTeacher.name,
    role: 'TEACHER',
  };

  const accessToken = generateToken(
    jwtPayload,
    configs.jwtAccessSecret as string,
    configs.jwtAccessExpiresIn as string,
  );

  const refreshToken = generateToken(
    jwtPayload,
    configs.jwtRefreshSecret as string,
    configs.jwtRefreshExpiresIn as string,
  );

  return {
    accessToken,
    refreshToken,
  };
};

// ----------------------------
// নতুন: Refresh Token
// ----------------------------
const refreshToken = async (token: string) => {
  const decoded = jwt.verify(
    token,
    configs.jwtRefreshSecret as string,
  ) as JwtPayload;

  const jwtPayload = {
    id: decoded.id,
    regNo: decoded.regNo,
    name: decoded.name,
    role: decoded.role,
  };

  const newAccessToken = generateToken(
    jwtPayload,
    configs.jwtAccessSecret as string,
    configs.jwtAccessExpiresIn as string,
  );

  return { accessToken: newAccessToken };
};

// ----------------------------
// নতুন: লগইন করা Teacher এর নিজের তথ্য
// ----------------------------
const getMe = async (loggedTeacher: JwtPayload) => {
  return prisma.teacher.findUniqueOrThrow({
    where: { id: loggedTeacher.id },
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
  login,
  refreshToken,
  getMe,
};