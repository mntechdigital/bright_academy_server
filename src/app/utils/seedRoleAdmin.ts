import prisma from '../../db/db.config';
import configs from '../configs';
import { seedRoleAdminData } from '../constant/seedRoleData';
import bcrypt from 'bcryptjs';

export const seedRoleAdmin = async () => {
  const existingRole = await prisma.role.findFirst();
  const existingAdmin = await prisma.adminUser.findFirst();

  if (!existingRole && !existingAdmin) {
    prisma.$transaction(async (prisma) => {
      const createRole = await prisma.role.create({
        data: {
          name: seedRoleAdminData.name,
          roleFeature: {
            create: seedRoleAdminData.roleFeature.map((roleFeature) => {
              return {
                name: roleFeature.name,
                path: roleFeature.path,
                index: roleFeature.index,
              };
            }),
          },
        },
      });

      const hashedPassword = await bcrypt.hash(configs.password as string, 10);

      await prisma.adminUser.create({
        data: {
          fullName: configs.adminFullName as string,
          email: configs.adminEmail as string,
          password: hashedPassword,
          roleId: createRole.id,
        },
      });
    });
  }
};
