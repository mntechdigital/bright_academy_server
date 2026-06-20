import { z } from "zod";

export const createWeeklyMarksSheetSchema = z.object({
  month: z.string(),
  week: z.string(),
  publishedDate: z.string(),
  year: z.string(),
  stdClassId: z.string(),
  subjectId: z.string(),
  totalMarks: z.number(),
  obtainedMarks: z.number().optional(),
});

// Add more validation schemas as needed
