import { z } from "zod";

const yearSchema = z
  .union([z.string(), z.number()])
  .optional()
  .nullable()
  .refine((v) => {
    if (v === undefined || v === null || String(v).trim() === "" || String(v).toLowerCase() === "all") return true;
    const n = Number(v);
    return Number.isInteger(n) && n >= 2000 && n <= 2100;
  }, "year must be an integer between 2000 and 2100");

const publishedDateSchema = z
  .union([z.string(), z.date()])
  .optional()
  .nullable()
  .refine((v) => {
    if (v === undefined || v === null || String(v).trim() === "") return true;
    const d = v instanceof Date ? v : new Date(v);
    return !Number.isNaN(d.getTime());
  }, "publishedDate must be a valid ISO date string or null");

const subjectResultSchema = z.object({
  id: z.string().optional(),
  subjectName: z.string().trim().min(1, "subjectName is required"),
  marks: z.number({ invalid_type_error: "marks must be a number" }).min(0, "marks must be >= 0"),
  fullMarks: z.number().min(0).optional().default(100),
  highestMark: z.number().min(0).optional().default(0),
  point: z.number().min(0).optional().default(0),
  grade: z.string().optional().default("F"),
  isAbsent: z.boolean().optional().default(false),
  // Practical exam mark: ICT 0-25, Science practical 0-75. Server computes total once.
  examMark: z.number().int().min(0).max(75).optional().nullable(),
  ictExamMark: z.number().int().min(0).max(25).optional().nullable(),
});

export const createMonthlyResultValidation = z.object({
  body: z.object({
    studentId: z.string().trim().min(1, "studentId is required"),
    month: z.string().trim().min(1, "month is required"),
    year: yearSchema,
    publishedDate: publishedDateSchema,
    monthlyExamName: z.string().trim().optional().nullable(),
    totalMarks: z.number().optional(),
    gpa: z.number().optional(),
    grade: z.string().optional(),
    position: z.union([z.string(), z.number()]).optional().nullable(),
    present: z.number().optional(),
    absent: z.number().optional(),
    ictPracticalAdded: z.boolean().optional(),
    results: z.array(subjectResultSchema).min(1, "results is required"),
  }),
});

export const updateMonthlyResultValidation = z.object({
  body: z.object({
    studentId: z.string().trim().optional(),
    month: z.string().trim().optional(),
    year: yearSchema,
    publishedDate: publishedDateSchema,
    monthlyExamName: z.string().trim().optional().nullable(),
    totalMarks: z.number().optional(),
    gpa: z.number().optional(),
    grade: z.string().optional(),
    position: z.union([z.string(), z.number()]).optional().nullable(),
    present: z.number().optional(),
    absent: z.number().optional(),
    ictPracticalAdded: z.boolean().optional(),
    results: z.array(subjectResultSchema.partial({ subjectName: true, marks: true })).optional(),
  }),
});

export const calculateMonthlyPositionsValidation = z.object({
  body: z.object({
    classId: z.string().trim().min(1, "classId is required"),
    month: z.string().trim().min(1, "month is required"),
    year: yearSchema,
    examName: z.string().trim().optional().nullable(),
  }),
});