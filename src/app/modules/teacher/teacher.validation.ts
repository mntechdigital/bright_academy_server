import { z } from 'zod';

const updateTeacherSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    regNo: z.string().optional(),
    password: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    regNo: z.string({ required_error: 'Registration number is required' }),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters long'),
  }),
});

export const TeacherValidation = {
  updateTeacherSchema,
  loginSchema,
};