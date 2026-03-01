import bcrypt from 'bcryptjs';
import prisma from '../../db/db.config';

const formatThreeDigitNumber = (number: number) => String(number).padStart(3, '0');

export const seedTeachers = async () => {
  try {
    for (let i = 1; i <= 30; i++) {
      const suffix = formatThreeDigitNumber(i);
      const name = `teacher-${suffix}`;
      const regNo = `bright-${suffix}`;
      const rawPassword = `bright-${suffix}`;

      const existingTeacher = await prisma.teacher.findUnique({
        where: {
          regNo,
        },
      });

      if (!existingTeacher) {
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        await prisma.teacher.create({
          data: {
            name,
            regNo,
            password: hashedPassword,
          },
        });
        console.log(`✓ Created teacher "${name}" with regNo "${regNo}"`);
      } else {
        console.log(`○ Teacher with regNo "${regNo}" already exists`);
      }
    }

    console.log('✓ Teacher seeding completed.');
  } catch (error) {
    console.error('✗ Error seeding teachers:', error);
  }
};
