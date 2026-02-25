import { z } from 'zod';

export const validateMonthlyResult = z.object({
  studentId: z.string(),
  subjectId: z.string(),
  fullMarks: z.number(),
  highestMark: z.number(),
  marksObtained: z.number(),
  point: z.number(),
  grade: z.string(),
  totalMarks: z.number(),
  gpa: z.number(),
  gradePoint: z.string(),
  position: z.string(),
  preenst: z.string(),
  absent: z.string(),
});

export const updatevalidateMonthlyResult = z.object({
  studentId: z.string().optional(),
  subjectId: z.string().optional(),
  fullMarks: z.number().optional(),
  highestMark: z.number().optional(),
  marksObtained: z.number().optional(),
  point: z.number().optional(),
  grade: z.string().optional(),
  totalMarks: z.number().optional(),
  gpa: z.number().optional(),
  gradePoint: z.string().optional(),
  position: z.string().optional(),
  preenst: z.string().optional(),
  absent: z.string().optional(),
});
