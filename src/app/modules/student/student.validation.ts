import { z } from "zod";

const createStudentSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(1, 'Name cannot be empty'),
    classId: z.string({ required_error: 'Class ID is required' }).min(1, 'Class ID cannot be empty'),
    parentPhone: z.string({ required_error: 'Parent phone is required' }).min(1, 'Parent phone cannot be empty'),
    address: z.string({ required_error: 'Address is required' }).min(1, 'Address cannot be empty'),
    gender: z.string({ required_error: 'Gender is required' }).min(1, 'Gender cannot be empty'),
    stdRegNo: z.string({ required_error: 'Student registration number is required' }).min(1, 'Student registration number is required'),
  })
});

const updateStudentSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    classId: z.string().optional(),
    parentPhone: z.string().optional(),
    address: z.string().optional(),
    gender: z.string().optional(),
    stdRegNo: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    userId: z.string({ required_error: 'User Id দিন' }),
    password: z.string({ required_error: 'Password দিন' }),
  }),
});

export const StudentValidation = {
  createStudentSchema,
  updateStudentSchema,
  loginSchema,
};
