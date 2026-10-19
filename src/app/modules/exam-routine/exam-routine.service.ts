import prisma from '../../../db/db.config';
import AppError from '../../errors/AppError';
import {
  MARKS_PER_SUBJECT,
  SUBJECTS_PER_WEEK,
  TOTAL_MARKS_PER_WEEK,
} from './exam-routine.constants';

export const ALLOWED_STREAMS = ['Science', 'Business', 'Humanity'] as const;
export type AllowedStream = (typeof ALLOWED_STREAMS)[number];

type Alternative = {
  name: string;
  streams: string[];
};

const toAlternatives = (value: unknown): Alternative[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Alternative =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Alternative).name === 'string' &&
      Array.isArray((item as Alternative).streams),
  );
};

const filterByStream = (
  alternatives: Alternative[],
  stream?: string,
): Alternative[] => {
  if (!stream) return alternatives;
  return alternatives.filter(
    (alt) => alt.streams.length === 0 || alt.streams.includes(stream),
  );
};

const shapeRoutine = (
  routine: {
    id: string;
    examName: string;
    year: string;
    month: string | null;
    createdAt: Date;
    updatedAt: Date;
    stdClass: { id: string; className: string };
    _count: { weeks: number };
    weeks: {
      id: string;
      weekNo: number;
      weekLabel: string;
      totalMarks: number;
      durationHours: number | null;
      subjects: {
        id: string;
        displayName: string;
        fullMarks: number;
        alternatives: unknown;
        subject: { id: string; subjectName: string };
      }[];
    }[];
  },
  stream?: string,
) => {
  return {
    id: routine.id,
    examName: routine.examName,
    year: routine.year,
    month: routine.month,
    stdClass: routine.stdClass,
    // Real number of stored week records, never the highest week number.
    weekCount: routine._count.weeks,
    weekNumbers: routine.weeks.map((week) => week.weekNo),
    weeks: routine.weeks.map((week) => {
      const computedMarks = week.subjects.reduce(
        (sum, subject) => sum + subject.fullMarks,
        0,
      );
      return {
        id: week.id,
        weekNo: week.weekNo,
        weekLabel: week.weekLabel,
        totalMarks: week.totalMarks,
        computedMarks,
        marksMismatch: computedMarks !== week.totalMarks,
        durationHours: week.durationHours,
        subjects: week.subjects.map((subject) => ({
          id: subject.id,
          displayName: subject.displayName,
          fullMarks: subject.fullMarks,
          alternatives: filterByStream(
            toAlternatives(subject.alternatives),
            stream,
          ),
          subject: subject.subject,
        })),
      };
    }),
  };
};

const routineInclude = {
  stdClass: {
    select: { id: true, className: true },
  },
  _count: {
    select: { weeks: true },
  },
  weeks: {
    orderBy: { weekNo: 'asc' as const },
    include: {
      subjects: {
        include: {
          subject: {
            select: { id: true, subjectName: true },
          },
        },
      },
    },
  },
};

const getAll = async (query: {
  year?: string;
  classId?: string;
  examName?: string;
  stream?: string;
}) => {
  if (
    query.stream &&
    !(ALLOWED_STREAMS as readonly string[]).includes(query.stream)
  ) {
    throw new AppError(
      400,
      `Invalid stream. Allowed values: ${ALLOWED_STREAMS.join(', ')}`,
    );
  }

  const routines = await prisma.examRoutine.findMany({
    where: {
      ...(query.year && { year: query.year }),
      ...(query.classId && { classId: query.classId }),
      ...(query.examName && { examName: query.examName }),
    },
    include: routineInclude,
    orderBy: { createdAt: 'asc' },
  });

  return routines.map((routine) => shapeRoutine(routine, query.stream));
};

const getById = async (id: string, stream?: string) => {
  if (stream && !(ALLOWED_STREAMS as readonly string[]).includes(stream)) {
    throw new AppError(
      400,
      `Invalid stream. Allowed values: ${ALLOWED_STREAMS.join(', ')}`,
    );
  }

  const routine = await prisma.examRoutine.findUnique({
    where: { id },
    include: routineInclude,
  });

  if (!routine) {
    throw new AppError(404, 'Exam routine not found');
  }

  return shapeRoutine(routine, stream);
};

type RoutineWriteAlternative = {
  name: string;
  streams: string[];
};

type RoutineWriteSubject = {
  subjectId: string;
  displayName?: string;
  fullMarks: number;
  alternatives?: RoutineWriteAlternative[];
};

type RoutineWriteWeek = {
  weekNo: number;
  weekLabel?: string;
  totalMarks: number;
  durationHours?: number | null;
  subjects: RoutineWriteSubject[];
};

type RoutineWritePayload = {
  examName: string;
  year: string;
  month?: string | null;
  classId: string;
  weeks: RoutineWriteWeek[];
};

// Every subjectId must exist AND belong to the routine's class.
// Returns a lookup used to default displayName to the Subject's subjectName.
const resolveSubjectsForClass = async (
  classId: string,
  weeks: RoutineWriteWeek[],
) => {
  const stdClass = await prisma.stdClass.findUnique({
    where: { id: classId },
  });

  if (!stdClass) {
    throw new AppError(404, `Class with ID ${classId} does not exist`);
  }

  const subjectIds = [...new Set(weeks.flatMap((week) => week.subjects.map((subject) => subject.subjectId)))];

  const subjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
  });
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));

  for (const subjectId of subjectIds) {
    const subject = subjectById.get(subjectId);
    if (!subject) {
      throw new AppError(400, `Subject with ID ${subjectId} does not exist`);
    }
    if (subject.classId !== classId) {
      throw new AppError(
        400,
        `Subject "${subject.subjectName}" does not belong to class "${stdClass.className}"`,
      );
    }
  }

  return { stdClass, subjectById };
};

const toWeekLabel = (week: RoutineWriteWeek): string => {
  const trimmed = week.weekLabel?.trim();
  return trimmed ? trimmed : `Week ${week.weekNo}`;
};

const toDisplayName = (
  subject: RoutineWriteSubject,
  subjectName: string,
): string => {
  const trimmed = subject.displayName?.trim();
  return trimmed ? trimmed : subjectName;
};

const toDurationHours = (week: RoutineWriteWeek): number | null => {
  return week.durationHours ?? null;
};

// Mirrors the DTO rules so the service is safe when called directly (the
// import script and internal callers bypass the Zod middleware).
const assertWeekShape = (week: RoutineWriteWeek) => {
  if (week.subjects.length !== SUBJECTS_PER_WEEK) {
    throw new AppError(
      400,
      `Week ${week.weekNo} must have exactly ${SUBJECTS_PER_WEEK} subjects, received ${week.subjects.length}`,
    );
  }

  const seen = new Set<string>();
  for (const subject of week.subjects) {
    if (subject.fullMarks !== MARKS_PER_SUBJECT) {
      throw new AppError(
        400,
        `Week ${week.weekNo}: every subject must be worth exactly ${MARKS_PER_SUBJECT} marks (subject "${subject.subjectId}" is ${subject.fullMarks})`,
      );
    }
    if (seen.has(subject.subjectId)) {
      throw new AppError(
        400,
        `Week ${week.weekNo}: the same subject cannot appear twice in the same week (subject "${subject.subjectId}")`,
      );
    }
    seen.add(subject.subjectId);
  }

  const sum = week.subjects.reduce(
    (total, subject) => total + subject.fullMarks,
    0,
  );
  if (week.totalMarks !== sum) {
    throw new AppError(
      400,
      `Week ${week.weekNo}: totalMarks (${week.totalMarks}) must equal the sum of the subject marks (${sum})`,
    );
  }
  if (week.totalMarks !== TOTAL_MARKS_PER_WEEK) {
    throw new AppError(
      400,
      `Week ${week.weekNo}: totalMarks must be exactly ${TOTAL_MARKS_PER_WEEK}`,
    );
  }
};

const assertWeekShapes = (weeks: RoutineWriteWeek[]) => {
  weeks.forEach(assertWeekShape);
};

// Looks up a routine by its natural key. Returns null when absent so callers
// can switch between "create" and "append weeks" without relying on a 409.
const findByKey = async (key: {
  examName: string;
  year: string;
  classId: string;
}) => {
  return prisma.examRoutine.findUnique({
    where: {
      examName_year_classId: {
        examName: key.examName,
        year: key.year,
        classId: key.classId,
      },
    },
  });
};

const create = async (payload: RoutineWritePayload) => {
  assertWeekShapes(payload.weeks);

  const { subjectById } = await resolveSubjectsForClass(
    payload.classId,
    payload.weeks,
  );

  const existing = await findByKey({
    examName: payload.examName,
    year: payload.year,
    classId: payload.classId,
  });

  if (existing) {
    // A routine for this class/exam/year already exists. Creating a second one
    // is never correct: the caller must append the missing weeks instead.
    throw new AppError(
      409,
      `Exam routine "${payload.examName}" for year ${payload.year} already exists for this class. Add the missing weeks to the existing routine instead of creating a new one.`,
    );
  }

  const created = await prisma.examRoutine.create({
    data: {
      examName: payload.examName,
      year: payload.year,
      month: payload.month ?? null,
      classId: payload.classId,
      weeks: {
        create: payload.weeks.map((week) => ({
          weekNo: week.weekNo,
          weekLabel: toWeekLabel(week),
          totalMarks: week.totalMarks,
          durationHours: toDurationHours(week),
          subjects: {
            create: week.subjects.map((subject) => ({
              displayName: toDisplayName(
                subject,
                subjectById.get(subject.subjectId)!.subjectName,
              ),
              fullMarks: subject.fullMarks,
              subjectId: subject.subjectId,
              alternatives: subject.alternatives ?? [],
            })),
          },
        })),
      },
    },
  });

  return getById(created.id);
};

// Appends new weeks to an existing routine. Existing weeks and their subjects
// are never modified or deleted, so this is safe to call repeatedly with any
// set of missing week numbers in any order.
const addWeeks = async (id: string, weeks: RoutineWriteWeek[]) => {
  assertWeekShapes(weeks);

  const routine = await prisma.examRoutine.findUnique({
    where: { id },
    select: { id: true, classId: true },
  });

  if (!routine) {
    throw new AppError(404, 'Exam routine not found');
  }

  const { subjectById } = await resolveSubjectsForClass(
    routine.classId,
    weeks,
  );

  const existingWeeks = await prisma.routineWeek.findMany({
    where: { routineId: id },
    select: { weekNo: true },
  });
  const takenWeekNos = new Set(existingWeeks.map((week) => week.weekNo));

  for (const week of weeks) {
    if (takenWeekNos.has(week.weekNo)) {
      throw new AppError(
        409,
        `Week ${week.weekNo} already exists in this routine`,
      );
    }
    takenWeekNos.add(week.weekNo);
  }

  await prisma.$transaction(
    async (tx) => {
      for (const week of weeks) {
        await tx.routineWeek.create({
          data: {
            routineId: id,
            weekNo: week.weekNo,
            weekLabel: toWeekLabel(week),
            totalMarks: week.totalMarks,
            durationHours: toDurationHours(week),
            subjects: {
              create: week.subjects.map((subject) => ({
                displayName: toDisplayName(
                  subject,
                  subjectById.get(subject.subjectId)!.subjectName,
                ),
                fullMarks: subject.fullMarks,
                subjectId: subject.subjectId,
                alternatives: subject.alternatives ?? [],
              })),
            },
          },
        });
      }
    },
    { timeout: 30000, maxWait: 15000 },
  );

  return getById(id);
};

const update = async (
  id: string,
  payload: Partial<RoutineWritePayload>,
) => {
  const existing = await prisma.examRoutine.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(404, 'Exam routine not found');
  }

  if (payload.classId && payload.classId !== existing.classId) {
    throw new AppError(
      400,
      'Changing the routine\u2019s class is not allowed; create a new routine for a different class instead',
    );
  }

  const examName = payload.examName ?? existing.examName;
  const year = payload.year ?? existing.year;
  const month = payload.month !== undefined ? payload.month : existing.month;

  const clash = await prisma.examRoutine.findUnique({
    where: {
      examName_year_classId: {
        examName,
        year,
        classId: existing.classId,
      },
    },
  });

  if (clash && clash.id !== id) {
    throw new AppError(
      409,
      `Exam routine "${examName}" for year ${year} already exists for this class`,
    );
  }

  let subjectById: Map<string, { subjectName: string }> | undefined;
  if (payload.weeks) {
    assertWeekShapes(payload.weeks);
    const resolved = await resolveSubjectsForClass(
      existing.classId,
      payload.weeks,
    );
    subjectById = resolved.subjectById;
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.examRoutine.update({
        where: { id },
        data: { examName, year, month },
      });

      if (payload.weeks && subjectById) {
        const wantedWeekNos = payload.weeks.map((week) => week.weekNo);

        for (const week of payload.weeks) {
          const routineWeek = await tx.routineWeek.upsert({
            where: {
              routineId_weekNo: { routineId: id, weekNo: week.weekNo },
            },
            update: {
              weekLabel: toWeekLabel(week),
              totalMarks: week.totalMarks,
              durationHours: toDurationHours(week),
            },
            create: {
              routineId: id,
              weekNo: week.weekNo,
              weekLabel: toWeekLabel(week),
              totalMarks: week.totalMarks,
              durationHours: toDurationHours(week),
            },
          });

          const wantedSubjectIds = week.subjects.map(
            (subject) => subject.subjectId,
          );

          for (const subject of week.subjects) {
            const alternatives = subject.alternatives ?? [];
            await tx.routineSubject.upsert({
              where: {
                weekId_subjectId: {
                  weekId: routineWeek.id,
                  subjectId: subject.subjectId,
                },
              },
              update: {
                displayName: toDisplayName(
                  subject,
                  subjectById.get(subject.subjectId)!.subjectName,
                ),
                fullMarks: subject.fullMarks,
                alternatives,
              },
              create: {
                weekId: routineWeek.id,
                displayName: toDisplayName(
                  subject,
                  subjectById.get(subject.subjectId)!.subjectName,
                ),
                fullMarks: subject.fullMarks,
                subjectId: subject.subjectId,
                alternatives,
              },
            });
          }

          // Weeks/subjects missing from the payload are removed.
          await tx.routineSubject.deleteMany({
            where: {
              weekId: routineWeek.id,
              subjectId: { notIn: wantedSubjectIds },
            },
          });
        }

        await tx.routineWeek.deleteMany({
          where: {
            routineId: id,
            weekNo: { notIn: wantedWeekNos },
          },
        });
      }
    },
    { timeout: 30000, maxWait: 15000 },
  );

  return getById(id);
};

const remove = async (id: string) => {
  const existing = await prisma.examRoutine.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(404, 'Exam routine not found');
  }

  // Weeks and subjects cascade-delete via the Prisma schema relations.
  await prisma.examRoutine.delete({ where: { id } });

  return { id };
};

type DuplicateResult =
  | {
      classId: string;
      className: string | null;
      status: 'created';
      routineId: string;
      unmatchedSubjects: string[];
    }
  | {
      classId: string;
      className: string | null;
      status: 'skipped';
      reason: string;
      unmatchedSubjects: string[];
    };

const duplicate = async (
  id: string,
  payload: { targetClassIds: string[]; targetYear?: string; examName?: string },
) => {
  const source = await prisma.examRoutine.findUnique({
    where: { id },
    include: {
      stdClass: { select: { id: true, className: true } },
      weeks: {
        orderBy: { weekNo: 'asc' },
        include: {
          subjects: {
            include: {
              subject: { select: { id: true, subjectName: true } },
            },
          },
        },
      },
    },
  });

  if (!source) {
    throw new AppError(404, 'Exam routine not found');
  }

  const newExamName = payload.examName ?? source.examName;
  const newYear = payload.targetYear ?? source.year;
  const results: DuplicateResult[] = [];

  for (const targetClassId of [...new Set(payload.targetClassIds)]) {
    const targetClass = await prisma.stdClass.findUnique({
      where: { id: targetClassId },
    });

    if (!targetClass) {
      results.push({
        classId: targetClassId,
        className: null,
        status: 'skipped',
        reason: `Class with ID ${targetClassId} does not exist`,
        unmatchedSubjects: [],
      });
      continue;
    }

    const clash = await prisma.examRoutine.findUnique({
      where: {
        examName_year_classId: {
          examName: newExamName,
          year: newYear,
          classId: targetClassId,
        },
      },
    });

    if (clash) {
      results.push({
        classId: targetClassId,
        className: targetClass.className,
        status: 'skipped',
        reason: `Routine "${newExamName}" for year ${newYear} already exists for class "${targetClass.className}"`,
        unmatchedSubjects: [],
      });
      continue;
    }

    const targetSubjects = await prisma.subject.findMany({
      where: { classId: targetClassId },
    });
    const targetByName = new Map(
      targetSubjects.map((subject) => [subject.subjectName, subject]),
    );

    const unmatched: string[] = [];
    const plannedWeeks = source.weeks.map((week) => ({
      weekNo: week.weekNo,
      weekLabel: week.weekLabel,
      totalMarks: week.totalMarks,
      durationHours: week.durationHours,
      subjects: week.subjects.flatMap((routineSubject) => {
        const target = targetByName.get(routineSubject.subject.subjectName);
        if (!target) {
          unmatched.push(routineSubject.subject.subjectName);
          return [];
        }
        return [
          {
            displayName: routineSubject.displayName,
            fullMarks: routineSubject.fullMarks,
            subjectId: target.id,
            alternatives: toAlternatives(routineSubject.alternatives),
          },
        ];
      }),
    }));

    const unmatchedSubjects = [...new Set(unmatched)];
    if (unmatchedSubjects.length > 0) {
      results.push({
        classId: targetClassId,
        className: targetClass.className,
        status: 'skipped',
        reason: `${unmatchedSubjects.length} subject(s) have no match in class "${targetClass.className}"`,
        unmatchedSubjects,
      });
      continue;
    }

    const created = await prisma.examRoutine.create({
      data: {
        examName: newExamName,
        year: newYear,
        month: source.month,
        classId: targetClassId,
        weeks: {
          create: plannedWeeks.map((week) => ({
            weekNo: week.weekNo,
            weekLabel: week.weekLabel,
            totalMarks: week.totalMarks,
            durationHours: week.durationHours,
            subjects: {
              create: week.subjects,
            },
          })),
        },
      },
    });

    results.push({
      classId: targetClassId,
      className: targetClass.className,
      status: 'created',
      routineId: created.id,
      unmatchedSubjects: [],
    });
  }

  return {
    sourceRoutineId: source.id,
    examName: newExamName,
    year: newYear,
    results,
  };
};

export const examRoutineService = {
  getAll,
  getById,
  create,
  addWeeks,
  update,
  delete: remove,
  duplicate,
};
