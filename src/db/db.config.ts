import { PrismaClient } from '@prisma/client';

const prisma: PrismaClient = new PrismaClient({
  log: ['error'],
});

export default prisma;
