import { z } from 'zod';

const createBatchSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Batch name আবশ্যক' }),
    startTime: z.string({ required_error: 'Start time আবশ্যক' }),
    endTime: z.string({ required_error: 'End time আবশ্যক' }),
    classId: z.string({ required_error: 'Class ID আবশ্যক' }),
  }),
});

const updateBatchSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    classId: z.string().optional(),
  }),
});

export const BatchValidation = {
  createBatchSchema,
  updateBatchSchema,
};