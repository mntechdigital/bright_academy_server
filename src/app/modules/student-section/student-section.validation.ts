import { z } from "zod";

const createSectionSchema = z.object({
  body: z.object({
    sectionName: z.string({ required_error: 'Section name is required' }).min(1, 'Section name cannot be empty'),
    classId: z.string({ required_error: 'Class ID is required' }).min(1, 'Class ID cannot be empty'),
  })
});

const updateSectionSchema = z.object({
  body: z.object({
    sectionName: z.string().optional(),
    classId: z.string().optional(),
  }),
});

export const StudentSectionValidation = {
  createSectionSchema,
  updateSectionSchema,
};
