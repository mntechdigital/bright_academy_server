import { seedRoleAdmin } from '../app/utils/seedRoleAdmin';
import { seedTeachers } from '../app/utils/seedTeacher';
import prisma from '../db/db.config';

const runSeed = async () => {
  try {
    await seedRoleAdmin();
    await seedTeachers();
    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

void runSeed().then(() => {
  process.exit(process.exitCode ?? 0);
});
