import { z } from "zod";

const createSubjectSchema = z.object({
  body: z.object({
    subjectName: z.string({ required_error: 'Subject name is required' }).min(1, 'Subject name cannot be empty'),
    classId: z.string({ required_error: 'Class ID is required' }).min(1, 'Class ID cannot be empty'),
  })
});

const updateSubjectSchema = z.object({
  body: z.object({
    subjectName: z.string().optional(),
    classId: z.string().optional(),
  }),
});

export const SubjectValidation = {
  createSubjectSchema,
  updateSubjectSchema,
};
