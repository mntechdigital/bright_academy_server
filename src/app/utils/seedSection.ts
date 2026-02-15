import prisma from '../../db/db.config';

export const seedSections = async () => {
  try {
    const sectionNames = ['A', 'B'];

    for (const sectionName of sectionNames) {
      // Check if section already exists
      const existingSection = await prisma.section.findUnique({
        where: {
          sectionName,
        },
      });

      if (!existingSection) {
        await prisma.section.create({
          data: {
            sectionName,
          },
        });
        console.log(`✓ Created section "${sectionName}"`);
      } else {
        console.log(`○ Section "${sectionName}" already exists`);
      }
    }

    console.log('✓ Section seeding completed.');
  } catch (error) {
    console.error('✗ Error seeding sections:', error);
  }
};