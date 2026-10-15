import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import prisma from '../db/db.config';

const ALLOWED_STREAMS = ['Science', 'Business', 'Humanity'] as const;

const alternativeSchema = z.object({
  name: z.string().min(1),
  streams: z.array(z.string()),
});

const subjectSlotSchema = z.object({
  name: z.string().min(1),
  marks: z.number().int().positive(),
  alternatives: z.array(alternativeSchema).optional().default([]),
});

const weekSchema = z.object({
  weekNo: z.number().int().positive(),
  weekLabel: z.string().min(1),
  totalMarks: z.number().int().positive(),
  durationHours: z.number().int().positive().nullable(),
  subjects: z.array(subjectSlotSchema).min(1),
});

const classGroupSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  classes: z.array(z.string().min(1)).min(1),
  weeks: z.array(weekSchema).min(1),
});

const routineFileSchema = z.object({
  examName: z.string().min(1),
  year: z.string().min(1),
  classGroups: z.array(classGroupSchema).min(1),
});

type RoutineFile = z.infer<typeof routineFileSchema>;

function resolveDefaultFile(): string {
  const candidates = [
    path.resolve(__dirname, '..', '..', '..', 'bright_academy_lbe_routine_2026_v2.json'),
    path.resolve(process.cwd(), 'bright_academy_lbe_routine_2026_v2.json'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0];
}

function parseArgs(argv: string[]): { file: string; apply: boolean } {
  let file = '';
  let apply = false;
  for (const arg of argv) {
    if (arg === '--apply') apply = true;
    else if (arg === '--dry-run') apply = false;
    else if (arg.startsWith('--file=')) file = arg.slice('--file='.length);
  }
  return { file: file || resolveDefaultFile(), apply };
}

async function main() {
  const { file, apply } = parseArgs(process.argv.slice(2));
  const mode = apply ? 'APPLY' : 'DRY-RUN';
  console.log(`[routine-import] mode=${mode} file=${file}`);

  if (!fs.existsSync(file)) {
    console.error(`[routine-import] ERROR: file not found: ${file}`);
    process.exit(1);
  }

  const parsed = routineFileSchema.safeParse(
    JSON.parse(fs.readFileSync(file, 'utf8')),
  );
  if (!parsed.success) {
    console.error('[routine-import] ERROR: invalid routine file:');
    console.error(JSON.stringify(parsed.error.flatten(), null, 2));
    process.exit(1);
  }
  const data: RoutineFile = parsed.data;

  const resolvedClasses: { className: string; id: string }[] = [];
  const missingClasses: string[] = [];
  const unmatchedSubjects: { className: string; weekLabel: string; name: string }[] = [];
  const markMismatches: {
    className: string;
    weekLabel: string;
    printed: number;
    computed: number;
  }[] = [];
  const invalidStreams: { className: string; slot: string; alternative: string; stream: string }[] = [];
  let matchedSlots = 0;

  // Plan holds only fully-resolvable classes; a class with ANY unmatched
  // subject slot is skipped entirely on apply (never guessed).
  const plan: {
    className: string;
    classId: string;
    weeks: {
      weekNo: number;
      weekLabel: string;
      totalMarks: number;
      durationHours: number | null;
      subjects: {
        displayName: string;
        fullMarks: number;
        subjectId: string;
        alternatives: { name: string; streams: string[] }[];
      }[];
    }[];
  }[] = [];

  const seenClasses = new Set<string>();
  for (const group of data.classGroups) {
    for (const className of group.classes) {
      if (seenClasses.has(className)) continue;
      seenClasses.add(className);

      const stdClass = await prisma.stdClass.findUnique({
        where: { className },
      });
      if (!stdClass) {
        missingClasses.push(className);
        continue;
      }
      resolvedClasses.push({ className, id: stdClass.id });

      const subjects = await prisma.subject.findMany({
        where: { classId: stdClass.id },
      });
      const subjectByName = new Map(subjects.map((s) => [s.subjectName, s.id]));

      let classBlocked = false;
      const plannedWeeks: (typeof plan)[number]['weeks'] = [];
      for (const week of group.weeks) {
        const computed = week.subjects.reduce((sum, s) => sum + s.marks, 0);
        if (computed !== week.totalMarks) {
          markMismatches.push({
            className,
            weekLabel: week.weekLabel,
            printed: week.totalMarks,
            computed,
          });
        }
        const plannedSubjects: (typeof plan)[number]['weeks'][number]['subjects'] = [];
        for (const slot of week.subjects) {
          const subjectId = subjectByName.get(slot.name);
          if (!subjectId) {
            unmatchedSubjects.push({ className, weekLabel: week.weekLabel, name: slot.name });
            classBlocked = true;
            continue;
          }
          matchedSlots += 1;
          for (const alt of slot.alternatives ?? []) {
            for (const stream of alt.streams) {
              if (!(ALLOWED_STREAMS as readonly string[]).includes(stream)) {
                invalidStreams.push({
                  className,
                  slot: slot.name,
                  alternative: alt.name,
                  stream,
                });
              }
            }
          }
          plannedSubjects.push({
            displayName: slot.name,
            fullMarks: slot.marks,
            subjectId,
            alternatives: (slot.alternatives ?? []).map((a) => ({
              name: a.name,
              streams: a.streams,
            })),
          });
        }
        plannedWeeks.push({
          weekNo: week.weekNo,
          weekLabel: week.weekLabel,
          totalMarks: week.totalMarks,
          durationHours: week.durationHours,
          subjects: plannedSubjects,
        });
      }
      if (!classBlocked) {
        plan.push({ className, classId: stdClass.id, weeks: plannedWeeks });
      }
    }
  }

  console.log(`[routine-import] examName="${data.examName}" year="${data.year}"`);
  console.log(
    `[routine-import] classes resolved=${resolvedClasses.length} ` +
      `(${resolvedClasses.map((c) => c.className).join(', ') || 'none'}) ` +
      `missing=${missingClasses.length} (${missingClasses.join(', ') || 'none'})`,
  );
  console.log(
    `[routine-import] subject slots matched=${matchedSlots} unmatched=${unmatchedSubjects.length}`,
  );
  for (const u of unmatchedSubjects) {
    console.log(`[routine-import] UNMATCHED class=${u.className} week=${u.weekLabel} name="${u.name}"`);
  }
  console.log(`[routine-import] weeks where sum(fullMarks) != totalMarks: ${markMismatches.length}`);
  for (const m of markMismatches) {
    console.log(
      `[routine-import] MARK-MISMATCH class=${m.className} week=${m.weekLabel} printed=${m.printed} computed=${m.computed}`,
    );
  }
  if (invalidStreams.length > 0) {
    console.log(`[routine-import] WARNING unknown streams: ${invalidStreams.length}`);
    for (const s of invalidStreams) {
      console.log(
        `[routine-import] UNKNOWN-STREAM class=${s.className} slot="${s.slot}" alternative="${s.alternative}" stream="${s.stream}"`,
      );
    }
  }

  const blockedClasses = resolvedClasses.filter((c) => !plan.some((p) => p.className === c.className));
  if (!apply) {
    console.log(
      `[routine-import] DRY-RUN complete. Would import ${plan.length} routine(s)` +
        `${blockedClasses.length > 0 ? `; BLOCKED (skipped on apply): ${blockedClasses.map((c) => c.className).join(', ')}` : ''}. No writes performed.`,
    );
    await prisma.$disconnect();
    return;
  }

  if (missingClasses.length > 0 || unmatchedSubjects.length > 0) {
    console.log(
      `[routine-import] APPLY proceeding for ${plan.length} clean routine(s); ` +
        `skipping ${missingClasses.length} missing + ${blockedClasses.length} blocked class(es).`,
    );
  }

  console.log(
    '[routine-import] WARNING: --apply writes directly to the same tables used by the admin routine editor; re-running it overwrites any admin edits for the routines in this JSON file.',
  );

  await prisma.$transaction(
    async (tx) => {
      for (const entry of plan) {
        const routine = await tx.examRoutine.upsert({
          where: {
            examName_year_classId: {
              examName: data.examName,
              year: data.year,
              classId: entry.classId,
            },
          },
          update: {},
          create: {
            examName: data.examName,
            year: data.year,
            classId: entry.classId,
          },
        });

        const wantedWeekNos = new Set<number>();
        for (const week of entry.weeks) {
          wantedWeekNos.add(week.weekNo);
          const routineWeek = await tx.routineWeek.upsert({
            where: {
              routineId_weekNo: { routineId: routine.id, weekNo: week.weekNo },
            },
            update: {
              weekLabel: week.weekLabel,
              totalMarks: week.totalMarks,
              durationHours: week.durationHours,
            },
            create: {
              routineId: routine.id,
              weekNo: week.weekNo,
              weekLabel: week.weekLabel,
              totalMarks: week.totalMarks,
              durationHours: week.durationHours,
            },
          });

          const wantedSubjectIds = new Set<string>();
          for (const subject of week.subjects) {
            wantedSubjectIds.add(subject.subjectId);
            await tx.routineSubject.upsert({
              where: {
                weekId_subjectId: {
                  weekId: routineWeek.id,
                  subjectId: subject.subjectId,
                },
              },
              update: {
                displayName: subject.displayName,
                fullMarks: subject.fullMarks,
                alternatives: subject.alternatives,
              },
              create: {
                weekId: routineWeek.id,
                displayName: subject.displayName,
                fullMarks: subject.fullMarks,
                subjectId: subject.subjectId,
                alternatives: subject.alternatives,
              },
            });
          }
          // Prune slots removed from the source file so re-imports converge.
          await tx.routineSubject.deleteMany({
            where: {
              weekId: routineWeek.id,
              subjectId: { notIn: [...wantedSubjectIds] },
            },
          });
        }
        // Prune weeks removed from the source file.
        await tx.routineWeek.deleteMany({
          where: {
            routineId: routine.id,
            weekNo: { notIn: [...wantedWeekNos] },
          },
        });
        console.log(`[routine-import] APPLIED routine class=${entry.className} id=${routine.id}`);
      }
    },
    { timeout: 30000, maxWait: 15000 },
  );

  console.log(`[routine-import] APPLY complete. Routines written: ${plan.length}.`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('[routine-import] FATAL:', error);
  await prisma.$disconnect();
  process.exit(1);
});
