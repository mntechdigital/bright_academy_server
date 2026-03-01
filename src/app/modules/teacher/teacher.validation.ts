import { z } from 'zod';

const updateTeacherSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    regNo: z.string().optional(),
    password: z.string().optional(),
  }),
});

export const TeacherValidation = {
  updateTeacherSchema,
};
