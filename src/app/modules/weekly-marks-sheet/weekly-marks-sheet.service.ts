import prisma from "../../../db/db.config";


export const createWeeklyMarksSheet = async (payload: any) => {
  const { classId, stdClassId, sectionId, subjectId, ...rest } = payload;

  // Use classId as stdClassId if provided for compatibility
  const finalStdClassId = stdClassId || classId;

  if (!finalStdClassId || !sectionId || !subjectId) {
    throw new Error("stdClassId (or classId), sectionId, and subjectId are required");
  }

  // Remove stdClassId, sectionId, subjectId from rest if present
  const { stdClassId: _s, sectionId: _sec, subjectId: _sub, ...data } = rest;

  return prisma.weeklyMarksSheet.create({
    data: {
      ...data,
      stdClass: { connect: { id: finalStdClassId } },
      section: { connect: { id: sectionId } },
      subject: { connect: { id: subjectId } },
    },
  });
};

// Add more service methods as needed
