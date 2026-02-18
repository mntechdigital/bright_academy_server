import { z } from "zod";

export const createWeeklyMarksSheetSchema = z.object({
  month: z.string(),
  week: z.string(),
  publishedDate: z.string(),
  year: z.string(),
  stdClassId: z.string(),
  sectionId: z.string(),
  subjectId: z.string(),
  totalMarks: z.number(),
});

// Add more validation schemas as needed
