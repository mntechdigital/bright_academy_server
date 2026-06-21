import { z } from "zod";

const createClassSchema = z.object({
  body: z.object({
    className: z.string({ required_error: 'class is required' }).min(1, 'class cannot be empty'),
  })
});


const updateClassSchema = z.object({
  body: z.object({
    className: z.string().optional(),
  }),
});

export const StudentClassValidation = {
  createClassSchema,
  updateClassSchema,
};
