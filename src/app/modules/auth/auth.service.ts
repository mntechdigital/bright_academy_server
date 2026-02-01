import { AdminUser, AdminUserStatus } from '@prisma/client';
import prisma from '../../../db/db.config';
import bcrypt from 'bcryptjs';
import { TLogin } from '../../types/auth.type';
import AppError from '../../errors/AppError';
import { generateToken } from '../../utils/tokenGenerator';
import configs from '../../configs';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { sendEmail } from '../../utils/sendEmail';
import { builderQuery } from '../../builders/prismaBuilderQuery';
import { deleteImageFile } from '../../utils/deleteFile';

const registerIntoDB = async (payload: AdminUser) => {
  const hashedPassword = await bcrypt.hash(payload.password as string, 10);

  const response = await prisma.adminUser.create({
    data: { ...payload, password: hashedPassword },
  });

  return response;
};

const loginIntoDB = async (payload: TLogin) => {
  const existingAdmin = await prisma.adminUser.findFirst({
    where: {
      email: payload.email,
    },
    include: {
      role: true,
    },
  });

  if (!existingAdmin) {
    throw new AppError(404, 'Admin user not found with this email');
  }

  if (existingAdmin.status === AdminUserStatus.INACTIVE) {
    throw new AppError(403, 'Admin user is inactive. Please contact support.');
  }

  const isPasswordMatch = await bcrypt.compare(
    payload.password as string,
    existingAdmin.password as string,
  );

  if (!isPasswordMatch) {
    throw new AppError(401, 'Password is incorrect');
  }

  const jwtPayload = {
    id: existingAdmin.id,
    email: existingAdmin.email,
    fullName: existingAdmin.fullName,
    role: existingAdmin.role.name,
    status: existingAdmin.status,
    profilePhoto: existingAdmin.profilePhoto,
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

const forgetPasswordIntoDB = async (payload: { email: string }) => {
  const userExists = await prisma.adminUser.findUniqueOrThrow({
    where: {
      email: payload.email,
    },
    include: {
      role: true,
    },
  });

  if (!userExists) {
    throw new AppError(404, 'User not found');
  }

  const jwtPayload = {
    id: userExists.id,
    email: userExists.email,
    fullName: userExists.fullName,
    status: userExists.status,
    role: userExists.role.name,
  };

  const accessToken = generateToken(
    jwtPayload,
    configs.jwtAccessSecret as string,
    '1h',
  );

  const resetLink = `${configs.clientUrl}/reset-password/?id=${userExists.id}&accessToken=${accessToken}`;

  sendEmail(resetLink, payload.email);

  return payload.email;
};

const resetPasswordIntoDB = async (
  id: string,
  password: string,
  token: string,
) => {
  const findUser = await prisma.adminUser.findUnique({
    where: {
      id,
    },
  });

  if (!findUser) {
    throw new AppError(404, 'User not found');
  }

  if (!token) {
    throw new AppError(400, 'Token is required');
  }

  const decoded = jwt.verify(
    token,
    configs.jwtAccessSecret as string,
  ) as JwtPayload;

  if (decoded.id !== findUser.id) {
    throw new AppError(401, 'Invalid token');
  }

  const hashedPassword = await bcrypt.hash(password as string, 10);

  await prisma.adminUser.update({
    where: {
      id,
    },
    data: {
      password: hashedPassword,
    },
  });

  return 'Password reset successfully';
};

const changePasswordIntoDB = async (
  loggedUser: JwtPayload,
  newPassword: string,
  currentPassword: string,
) => {
  const existingAdmin = await prisma.adminUser.findUnique({
    where: {
      id: loggedUser.id,
    },
  });

  if (!existingAdmin) {
    throw new AppError(404, 'Admin user not found');
  }

  const isPasswordMatch = await bcrypt.compare(
    currentPassword as string,
    existingAdmin.password as string,
  );

  if (!isPasswordMatch) {
    throw new AppError(500, 'Current password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(newPassword as string, 10);

  const response = await prisma.adminUser.update({
    where: {
      id: loggedUser.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  return response;
};

const refreshAccessTokenIntoDB = async (refreshToken: string) => {
  const decoded = jwt.verify(
    refreshToken,
    configs.jwtRefreshSecret as string,
  ) as JwtPayload;

  const jwtPayload = {
    email: decoded.email,
    fullName: decoded.fullName,
    role: decoded.role,
    status: decoded.status,
    id: decoded.id,
  };

  const newAccessToken = generateToken(
    jwtPayload,
    configs.jwtAccessSecret as string,
    configs.jwtAccessExpiresIn as string,
  );

  return newAccessToken;
};

const getLoggedAdminDetailsFromDB = async (user: JwtPayload) => {
  const response = await prisma.adminUser.findUniqueOrThrow({
    where: {
      id: user.id,
    },
    include: {
      role: {
        include: {
          roleFeature: {
            orderBy: {
              index: 'asc',
            },
          },
        },
      },
    },
  });

  return response;
};

const updateAdminProfileIntoDB = async (
  loggedU: JwtPayload,
  payload: Partial<AdminUser>,
) => {
  const existingAdmin = await prisma.adminUser.findUnique({
    where: {
      id: loggedU.id,
    },
  });

  if (!existingAdmin) {
    throw new AppError(404, 'Admin user not found');
  }

  const response = await prisma.adminUser.update({
    where: {
      id: loggedU.id,
    },
    data: payload,
  });

  return response;
};

const getAdminUsersFromDB = async (query: Record<string, any>) => {
  const usersQuery = builderQuery({
    searchFields: ['fullName', 'email'],
    searchTerm: query.searchTerm,
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : {},
    filter: query.filter ? JSON.parse(query.filter) : {},
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
  });

  const [users, totalCount] = await prisma.$transaction([
    prisma.adminUser.findMany({
      where: usersQuery.where,
      include: {
        role: {
          include: {
            roleFeature: true,
          },
        },
      },
    }),
    prisma.adminUser.count({
      where: usersQuery.where,
    }),
  ]);

  return {
    meta: {
      totalItems: totalCount,
      currentPage: Number(query.page) || 1,
      totalPages: Math.ceil(totalCount / usersQuery.take),
    },
    data: users,
  };
};

const changeAdminUserStatusIntoDB = async (id: string) => {
  const existingAdminUser = await prisma.adminUser.findUnique({
    where: { id },
  });

  if (!existingAdminUser) {
    throw new AppError(404, 'Admin user not found');
  }

  const response = await prisma.adminUser.update({
    where: { id },
    data: {
      status:
        existingAdminUser.status === AdminUserStatus.ACTIVE
          ? AdminUserStatus.INACTIVE
          : AdminUserStatus.ACTIVE,
    },
  });

  return response;
};

const deleteAdminUserFromDB = async (loggedUser: JwtPayload, id: string) => {
  const existingAdminUser = await prisma.adminUser.findUnique({
    where: { id },
  });

  if (existingAdminUser?.id === loggedUser.id) {
    throw new AppError(403, 'You cannot delete your own account');
  }

  if (!existingAdminUser) {
    throw new AppError(404, 'Admin user not found');
  }

  const response = await prisma.adminUser.delete({
    where: { id },
  });

  if (existingAdminUser.profilePhoto) {
    deleteImageFile(existingAdminUser.profilePhoto);
  }

  return response;
};

export const AuthServices = {
  registerIntoDB,
  loginIntoDB,
  forgetPasswordIntoDB,
  resetPasswordIntoDB,
  changePasswordIntoDB,
  refreshAccessTokenIntoDB,
  getLoggedAdminDetailsFromDB,
  updateAdminProfileIntoDB,
  getAdminUsersFromDB,
  changeAdminUserStatusIntoDB,
  deleteAdminUserFromDB,
};
