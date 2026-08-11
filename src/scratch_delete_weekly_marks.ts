import prisma from './db/db.config';

async function deleteAllWeeklyMarks() {
  try {
    console.log('Starting deletion of all weekly marks data...');
    
    // Delete all records from WeeklyMarksSheet
    const result = await prisma.weeklyMarksSheet.deleteMany();
    
    console.log(`Successfully deleted ${result.count} weekly marks records from the database.`);
    
    // Verify deletion
    const remainingCount = await prisma.weeklyMarksSheet.count();
    console.log(`Remaining weekly marks records: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('✓ All weekly marks data has been successfully deleted.');
    } else {
      console.log('⚠ Warning: Some records still remain in the database.');
    }
    
  } catch (error) {
    console.error('Error deleting weekly marks data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the deletion
deleteAllWeeklyMarks();