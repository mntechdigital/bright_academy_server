import { z } from "zod";

const createNoticeSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(1, 'Title cannot be empty'),
    pdfUrl: z.string({ required_error: 'PDF URL is required' }).min(1, 'PDF URL cannot be empty'),
  })
});

const updateNoticeSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    pdfUrl: z.string().optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const NoticeValidation = {
  createNoticeSchema,
  updateNoticeSchema,
};
