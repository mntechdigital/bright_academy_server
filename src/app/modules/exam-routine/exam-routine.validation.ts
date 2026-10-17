import { z } from 'zod';

export const STREAMS = ['Science', 'Business', 'Humanity'] as const;

export const examRoutineQuerySchema = z.object({
  year: z.string().min(1).optional(),
  classId: z.string().min(1).optional(),
  examName: z.string().min(1).optional(),
  stream: z.enum(STREAMS).optional(),
});

export const examRoutineByIdQuerySchema = z.object({
  stream: z.enum(STREAMS).optional(),
});

const alternativeSchema = z.object({
  name: z
    .string({ required_error: 'Alternative name is required' })
    .trim()
    .min(1, 'Alternative name cannot be empty'),
  streams: z.array(z.enum(STREAMS)).default([]),
});

const routineSubjectSchema = z.object({
  subjectId: z
    .string({ required_error: 'subjectId is required' })
    .min(1, 'subjectId cannot be empty'),
  displayName: z.string().trim().min(1, 'displayName cannot be empty').optional(),
  fullMarks: z
    .number({ required_error: 'fullMarks is required' })
    .int('fullMarks must be an integer')
    .positive('fullMarks must be a positive integer'),
  alternatives: z.array(alternativeSchema).optional().default([]),
});

const routineWeekSchema = z
  .object({
    weekNo: z
      .number({ required_error: 'weekNo is required' })
      .int('weekNo must be an integer')
      .min(1, 'weekNo must be at least 1'),
    weekLabel: z.string().trim().min(1, 'weekLabel cannot be empty').optional(),
    totalMarks: z
      .number({ required_error: 'totalMarks is required' })
      .int('totalMarks must be an integer')
      .positive('totalMarks must be a positive integer'),
    durationHours: z
      .number()
      .int('durationHours must be an integer')
      .positive('durationHours must be a positive integer')
      .nullable()
      .optional(),
    subjects: z
      .array(routineSubjectSchema)
      .min(1, 'Each week must have at least one subject'),
  })
  .superRefine((week, ctx) => {
    const seenSubjectIds = new Set<string>();
    week.subjects.forEach((subject) => {
      if (seenSubjectIds.has(subject.subjectId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate subjectId "${subject.subjectId}": the same subject cannot appear twice in the same week`,
        });
      }
      seenSubjectIds.add(subject.subjectId);
    });
  });

const routineWeeksSchema = z
  .array(routineWeekSchema)
  .min(1, 'At least one week is required')
  .superRefine((weeks, ctx) => {
    const seenWeekNos = new Set<number>();
    weeks.forEach((week) => {
      if (seenWeekNos.has(week.weekNo)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate weekNo ${week.weekNo}: weekNo must be unique within the routine`,
        });
      }
      seenWeekNos.add(week.weekNo);
    });
  });

const examNameSchema = z
  .string({ required_error: 'examName is required' })
  .trim()
  .min(1, 'examName cannot be empty');

const yearSchema = z
  .string({ required_error: 'year is required' })
  .regex(/^\d{4}$/, 'year must be a 4-digit string');

const monthSchema = z
  .string()
  .trim()
  .min(1, 'month cannot be empty')
  .nullable()
  .optional();

export const createExamRoutineSchema = z.object({
  body: z.object({
    examName: examNameSchema,
    year: yearSchema,
    month: monthSchema,
    classId: z
      .string({ required_error: 'classId is required' })
      .min(1, 'classId cannot be empty'),
    weeks: routineWeeksSchema,
  }),
});

export const updateExamRoutineSchema = z
  .object({
    body: z.object({
      examName: examNameSchema.optional(),
      year: yearSchema.optional(),
      month: monthSchema,
      classId: z.string().min(1, 'classId cannot be empty').optional(),
      weeks: routineWeeksSchema.optional(),
    }),
  })
  .superRefine((value, ctx) => {
    const body = value.body;
    if (
      body.examName === undefined &&
      body.year === undefined &&
      body.month === undefined &&
      body.classId === undefined &&
      body.weeks === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Nothing to update: provide at least one of examName, year, month, classId or weeks',
      });
    }
  });

export const duplicateExamRoutineSchema = z.object({
  body: z.object({
    targetClassIds: z
      .array(z.string().min(1, 'targetClassIds cannot contain empty values'))
      .min(1, 'At least one target class is required'),
    targetYear: yearSchema.optional(),
    examName: examNameSchema.optional(),
  }),
});

// Appends one or more new weeks to an existing routine. Existing weeks are
// never touched, and weekNo must not collide with a week already stored.
export const addExamRoutineWeeksSchema = z.object({
  body: z.object({
    weeks: routineWeeksSchema,
  }),
});

export const ExamRoutineValidation = {
  examRoutineQuerySchema,
  examRoutineByIdQuerySchema,
  createExamRoutineSchema,
  updateExamRoutineSchema,
  duplicateExamRoutineSchema,
  addExamRoutineWeeksSchema,
};
