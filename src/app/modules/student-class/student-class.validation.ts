import { z } from "zod";

const createStudentClassValidation = z.object({
  body: z.object({
    className: z.string({ required_error: "Class name is required" }),
  }),
});

const updateStudentClassValidation = z.object({
  body: z.object({
    className: z.string().optional(),
  }),
});

export const StudentClassValidation = {
  createStudentClassValidation,
  updateStudentClassValidation,
};
