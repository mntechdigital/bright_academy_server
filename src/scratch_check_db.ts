import prisma from "./db/db.config";

async function main() {
  console.log("Checking DB records...");
  const students = await prisma.student.findMany({
    include: {
      stdClass: true,
      section: true,
    }
  });
  console.log(`Found ${students.length} students:`);
  console.log(JSON.stringify(students.slice(0, 3), null, 2));

  const monthlyResults = await prisma.monthlyExamResult.findMany({
    include: {
      results: true,
      student: {
        include: {
          stdClass: true,
          section: true,
        }
      }
    }
  });
  console.log(`Found ${monthlyResults.length} monthly results:`);
  console.log(JSON.stringify(monthlyResults.slice(0, 3), null, 2));

  const weeklyMarks = await prisma.weeklyMarksSheet.findMany({
    include: {
      subject: true,
      student: {
        include: {
          stdClass: true,
          section: true,
        }
      }
    }
  });
  console.log(`Found ${weeklyMarks.length} weekly marks:`);
  console.log(JSON.stringify(weeklyMarks.slice(0, 3), null, 2));
}

main()
  .catch(e => {
    console.error("Error running script:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
