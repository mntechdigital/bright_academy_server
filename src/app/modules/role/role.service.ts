import { Role, RoleFeature } from '@prisma/client';
import prisma from '../../../db/db.config';
import { builderQuery } from '../../builders/prismaBuilderQuery';

interface IRoleType extends Role {
  roleFeature: RoleFeature[];
}

const createRoleIntoDB = async (payload: IRoleType) => {
  const existingRoleWithName = await prisma.role.findFirst({
    where: {
      name: payload.name,
    },
  });

  if (existingRoleWithName) {
    throw new Error(`Role with name ${payload.name} already exists`);
  }

  const role = await prisma.role.create({
    data: {
      ...payload,
      roleFeature: {
        create: payload.roleFeature.map((feature) => ({
          name: feature.name,
          path: feature.path,
          index: feature.index,
        })),
      },
    },
  });

  return role;
};

const getRolesFromDB = async (query: Record<string, any>) => {
  const rolesQuery = builderQuery({
    searchFields: ['name'],
    searchTerm: query.searchTerm,
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : {},
    filter: query.filter ? JSON.parse(query.filter) : {},
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
  });

  const [roles, totalCount] = await prisma.$transaction([
    prisma.role.findMany({
      where: rolesQuery.where,
      include: {
        roleFeature: true,
        adminUser: true
      },
    }),
    prisma.role.count({
      where: rolesQuery.where,
    }),
  ]);

  return {
    meta: {
      totalItems: totalCount,
      currentPage: Number(query.page) || 1,
      totalPages: Math.ceil(totalCount / rolesQuery.take),
    },
    data: roles,
  };
};

const getRoleByIdFromDB = async (id: string) => {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      roleFeature: true,
      adminUser: true
    },
  });

  if (!role) {
    throw new Error(`Role with ID ${id} not found`);
  }

  return role;
};

const updateRoleIntoDB = async (id: string, payload: Partial<IRoleType>) => {
  const existingRole = await prisma.role.findUniqueOrThrow({
    where: { id },
  });

  const existingRoleWithName = await prisma.role.findFirst({
    where: {
      name: payload.name,
      id: {
        not: id,
      },
    },
  });
  if (existingRoleWithName) {
    throw new Error(`Role with name ${payload.name} already exists`);
  }
  if (!existingRole) {
    throw new Error(`Role with ID ${id} not found`);
  }

  const updatedRole = await prisma.role.update({
    where: { id },
    data: {
      ...payload,
      roleFeature: {
        deleteMany: {},
        create: payload.roleFeature?.map((feature) => ({
          name: feature.name,
          path: feature.path,
          index: feature.index,
        })),
      },
    },
  });
  return updatedRole;
};

const deleteRoleFromDB = async (id: string) => {
  const role = await prisma.role.findUnique({
    where: { id },
  });

  if (!role) {
    throw new Error(`Role with ID ${id} not found`);
  }

  const deletedRole = await prisma.role.delete({
    where: { id },
  });

  return deletedRole;
};


const updateAdminUserRole = async (adminUserId: string, newRoleId: string) => {
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
  });
  if (!adminUser) {
    throw new Error(`Admin User with ID ${adminUserId} not found`);
  }
  const updatedAdminUser = await prisma.adminUser.update({
    where: { id: adminUserId },
    data: { roleId: newRoleId },
  });
  return updatedAdminUser;
};

const deleteAdminUserFromDB = async (adminUserId: string) => {
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
  });
  if (!adminUser) {
    throw new Error(`Admin User with ID ${adminUserId} not found`);
  }
  const deletedAdminUser = await prisma.adminUser.delete({
    where: { id: adminUserId },
  });
  return deletedAdminUser;
}

export const RoleService = {
  createRoleIntoDB,
  getRolesFromDB,
  getRoleByIdFromDB,
  updateRoleIntoDB,
  deleteRoleFromDB,
  updateAdminUserRole,
  deleteAdminUserFromDB
};
