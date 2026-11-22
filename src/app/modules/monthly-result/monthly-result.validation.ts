import { z } from "zod";

export const calculateMonthlyPositionsValidation = z.object({
  body: z.object({
    classId: z.string().trim().min(1, "classId is required"),
    month: z.string().trim().min(1, "month is required"),
    year: z.union([z.string(), z.number()]).optional().nullable().refine((v) => {
      if (v === undefined || v === null || String(v).trim() === "" || String(v).toLowerCase() === "all") return true;
      const n = Number(v);
      return Number.isInteger(n) && n >= 2000 && n <= 2100;
    }, "year is invalid"),
    examName: z.string().trim().optional().nullable(),
  }),
});