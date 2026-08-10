import { z } from "zod";

export const createWeeklyMarksSheetSchema = z.object({
  month: z.string().optional(),
  week: z.string().optional(),
  year: z.string().optional(),
  subjectId: z.string().optional(),
  stdClassId: z.string().optional(),
  classId: z.string().optional(),
  batchId: z.string().optional(),
  studentId: z.string().optional(),
  publishedDate: z.string().optional(),
  totalMarks: z.number().optional(),
  obtainedMarks: z.number().optional(),
}).passthrough(); // Allow additional fields

// Add more validation schemas as needed
