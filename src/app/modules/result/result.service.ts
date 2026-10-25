import prisma from '../../../db/db.config';

const WEEKLY_EXAM_NAME = 'LBE Weekly Exam Routine';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const normalizeWeek = (week: string): number | null => {
  const cleaned = week.replace(/Week[- ]?/i, '').trim();
  return /^\d+$/.test(cleaned) ? parseInt(cleaned, 10) : null;
};

// Accepts "December", "DECEMBER", "december", "Dec" or "12" and returns 1..12.
const monthNumber = (month: string | null | undefined): number | null => {
  if (!month) return null;
  const value = String(month).trim();
  if (!value) return null;
  if (/^\d+$/.test(value)) {
    const n = parseInt(value, 10);
    return n >= 1 && n <= 12 ? n : null;
  }
  const key = value.toLowerCase().replace(/[^a-z]/g, '');
  const index = MONTH_NAMES.findIndex((name) => {
    const lower = name.toLowerCase();
    return lower === key || lower.slice(0, 3) === key;
  });
  return index >= 0 ? index + 1 : null;
};

// The weekly marks table stores the full month name ("December"). Convert any
// accepted dropdown/request format to that canonical value before querying.
const canonicalMonth = (month: string): string | null => {
  const n = monthNumber(month);
  return n ? MONTH_NAMES[n - 1] : null;
};

const sameMonth = (a: string | null | undefined, b: string | null | undefined): boolean => {
  const na = monthNumber(a);
  const nb = monthNumber(b);
  return na !== null && na === nb;
};

type MeritTotal = { studentId: string; totalMarks: number };

const rankTotals = (totals: MeritTotal[]): (MeritTotal & { position: number })[] => {
  totals.sort((a, b) => b.totalMarks - a.totalMarks);
  return totals.map((item, index) => ({ ...item, position: index + 1 }));
};

const gradePoint = (marks: number, fullMarks: number): number => {
  if (fullMarks <= 0) return 0;
  const use400 = fullMarks === 400;
  const use75 = fullMarks === 75;
  const use50 = fullMarks === 50;
  const use25 = fullMarks === 25;
  const systems: Record<string, { min: number; max: number; gp: number }[]> = {
    '400': [
      { min: 317, max: 400, gp: 5 }, { min: 277, max: 316, gp: 4 }, { min: 237, max: 276, gp: 3.5 },
      { min: 197, max: 236, gp: 3 }, { min: 157, max: 196, gp: 2 }, { min: 129, max: 156, gp: 1 },
      { min: 0, max: 128, gp: 0 },
    ],
    '75': [
      { min: 58, max: 75, gp: 5 }, { min: 49, max: 57, gp: 4 }, { min: 43, max: 48, gp: 3.5 },
      { min: 37, max: 42, gp: 3 }, { min: 31, max: 36, gp: 2 }, { min: 25, max: 30, gp: 1 },
      { min: 0, max: 24, gp: 0 },
    ],
    '50': [
      { min: 40, max: 50, gp: 5 }, { min: 35, max: 39, gp: 4 }, { min: 30, max: 34, gp: 3.5 },
      { min: 26, max: 29, gp: 3 }, { min: 20, max: 25, gp: 2 }, { min: 17, max: 19, gp: 1 },
      { min: 0, max: 16, gp: 0 },
    ],
    '25': [
      { min: 20, max: 25, gp: 5 }, { min: 17, max: 19, gp: 4 }, { min: 15, max: 16, gp: 3.5 },
      { min: 13, max: 14, gp: 3 }, { min: 11, max: 12, gp: 2 }, { min: 9, max: 10, gp: 1 },
      { min: 0, max: 8, gp: 0 },
    ],
  };
  let sys = systems['100'];
  if (use400) sys = systems['400'];
  else if (use75) sys = systems['75'];
  else if (use50) sys = systems['50'];
  else if (use25) sys = systems['25'];
  for (const g of sys) {
    if (marks >= g.min && marks <= g.max) return g.gp;
  }
  return 0;
};

export const getWeeklyResults = async (query: Record<string, any>) => {
  const classId = query.classId ? String(query.classId) : '';
  const batchId = query.batchId ? String(query.batchId) : '';
  const rawMonth = query.month ? String(query.month) : '';
  // Marks are stored with full month names; accept "12", "DECEMBER", "Dec", ...
  const month = rawMonth ? canonicalMonth(rawMonth) ?? rawMonth.trim() : '';
  const year = query.year ? String(query.year).trim() : '';
  const weekParam = query.week ? String(query.week) : '1';
  const search = String(query.searchTerm || query.search || '');
  const sortBy = query.sortBy ? String(query.sortBy) : 'position';
  const order = query.order === 'desc' ? 'desc' : 'asc';
  const top = query.top ? String(query.top) : 'All';
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 20;

  // Routine lookup: class + year only. The routine no longer owns a month
  // (ExamRoutine.month is nullable/legacy), so a month must never be required.
  // Prefer the weekly exam name; if a routine happens to have a month set, use
  // it only to pick between otherwise-equal candidates, never as a filter.
  let routine: any = null;
  if (classId && year) {
    const routines = await prisma.examRoutine.findMany({
      where: { classId, year },
      include: { weeks: { orderBy: { weekNo: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
    const weeklyRoutines = routines.filter((r) => r.examName === WEEKLY_EXAM_NAME);
    const candidates = weeklyRoutines.length > 0 ? weeklyRoutines : routines;
    const monthMatched = month
      ? candidates.filter((r) => r.month && sameMonth(r.month, month))
      : [];
    routine =
      monthMatched[0] ??
      candidates.find((r) => !r.month) ??
      candidates[0] ??
      null;
  }
  const routineFound = !!routine;

  const weekTotalMap = new Map<number, number>();
  if (routine) {
    for (const w of routine.weeks) weekTotalMap.set(w.weekNo, w.totalMarks);
  }

  const isOverall = weekParam.trim().toLowerCase() === 'overall';
  const requestedWeek = isOverall ? null : normalizeWeek(weekParam);

  let routineTotal = 0;
  if (routine) {
    if (isOverall) {
      for (const w of routine.weeks) {
        if ([1, 2, 3, 4].includes(w.weekNo)) routineTotal += w.totalMarks;
      }
    } else if (requestedWeek) {
      routineTotal = weekTotalMap.get(requestedWeek) ?? 0;
    }
  }

  if (!classId || !routineFound || !month || !year) {
    return {
      meta: { totalItems: 0, totalPages: 0, currentPage: page },
      data: [],
      routineTotal: routineTotal || null,
      routineFound,
      noMarksForWeek: false,
      someWeeksMissingMarks: false,
    };
  }

  const students = await prisma.student.findMany({
    where: { classId },
    include: { batch: true },
    orderBy: { name: 'asc' },
  });

  const marks = await prisma.weeklyMarksSheet.findMany({
    where: { stdClassId: classId, month, year },
    select: { studentId: true, obtainedMarks: true, week: true, subjectId: true, totalMarks: true },
  });

  const weeksWithMarks = new Set<number>();
  for (const m of marks) {
    const wn = normalizeWeek(m.week);
    if (wn && [1, 2, 3, 4].includes(wn) && m.obtainedMarks !== null) {
      weeksWithMarks.add(wn);
    }
  }

  const selectedWeekHasMarks = isOverall
    ? weeksWithMarks.size > 0
    : requestedWeek
      ? weeksWithMarks.has(requestedWeek)
      : false;

  // Sum in exactly the same order as the student-result merit endpoint
  // (weekly-marks-sheet service): marks as returned for class + month + year,
  // week-filtered, null marks skipped. This keeps tied positions identical.
  const studentAchieved = new Map<string, number>();
  for (const m of marks) {
    if (!m.studentId || m.obtainedMarks === null) continue;
    const wn = normalizeWeek(m.week);
    if (!wn) continue;
    const inPeriod = isOverall ? [1, 2, 3, 4].includes(wn) : wn === requestedWeek;
    if (!inPeriod) continue;
    studentAchieved.set(m.studentId, (studentAchieved.get(m.studentId) ?? 0) + m.obtainedMarks);
  }

  const rankedMap = new Map<string, number>();
  if (selectedWeekHasMarks) {
    const totals = [...studentAchieved.entries()].map(([studentId, totalMarks]) => ({
      studentId,
      totalMarks,
    }));
    const ranked = rankTotals(totals);
    for (const r of ranked) rankedMap.set(r.studentId, r.position);
  }

  // GPA computation
  const computeGpa = (studentId: string): number => {
    if (isOverall) {
      const subjMap = new Map<string, number[]>();
      for (const m of marks) {
        if (m.studentId !== studentId) continue;
        const wn = normalizeWeek(m.week);
        if (!wn || ![1, 2, 3, 4].includes(wn)) continue;
        if (m.obtainedMarks === null) continue;
        if (!subjMap.has(m.subjectId)) subjMap.set(m.subjectId, []);
        subjMap.get(m.subjectId)!.push(gradePoint(m.obtainedMarks, m.totalMarks || 100));
      }
      const subjectMeans: number[] = [];
      for (const pts of subjMap.values()) {
        if (pts.length > 0) subjectMeans.push(pts.reduce((a, b) => a + b, 0) / pts.length);
      }
      if (subjectMeans.length === 0) return 0;
      return subjectMeans.reduce((a, b) => a + b, 0) / subjectMeans.length;
    }
    if (!requestedWeek) return 0;
    const subjMap = new Map<string, number[]>();
    for (const m of marks) {
      if (m.studentId !== studentId) continue;
      const wn = normalizeWeek(m.week);
      if (wn !== requestedWeek) continue;
      if (m.obtainedMarks === null) continue;
      if (!subjMap.has(m.subjectId)) subjMap.set(m.subjectId, []);
      subjMap.get(m.subjectId)!.push(gradePoint(m.obtainedMarks, m.totalMarks || 100));
    }
    const pts = [...subjMap.values()].map((arr) => arr.reduce((a, b) => a + b, 0) / arr.length);
    if (pts.length === 0) return 0;
    return pts.reduce((a, b) => a + b, 0) / pts.length;
  };

  let rows = students.map((s) => ({
    studentId: s.id,
    student: {
      id: s.id,
      name: s.name,
      parentPhone: s.parentPhone,
      stdRegNo: s.stdRegNo,
      batch: s.batch ? { id: s.batch.id, name: s.batch.name } : null,
      batchId: s.batchId,
    },
    batchId: s.batchId,
    totalMark: routineTotal,
    achievedMark: studentAchieved.get(s.id) ?? 0,
    position: rankedMap.has(s.id) ? rankedMap.get(s.id)! : null,
    gpa: computeGpa(s.id),
  }));

  // search
  if (search) {
    const lower = search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.student.name?.toLowerCase().includes(lower) ||
        r.student.stdRegNo?.toLowerCase().includes(lower) ||
        r.student.parentPhone?.toLowerCase().includes(lower),
    );
  }

  // batch
  if (batchId) {
    rows = rows.filter((r) => r.batchId === batchId || r.student?.batch?.id === batchId);
  }

  // top
  if (top !== 'All') {
    const n = parseInt(top.replace('Top ', ''), 10);
    if (!isNaN(n)) {
      rows = rows.filter((r) => r.position !== null && (r.position as number) <= n);
    }
  }

  // sort
  rows.sort((a: any, b: any) => {
    let va: any;
    let vb: any;
    if (sortBy === 'position') {
      if (a.position === null && b.position === null) return 0;
      if (a.position === null) return 1;
      if (b.position === null) return -1;
      va = a.position;
      vb = b.position;
    } else if (sortBy === 'achievedMark') {
      va = a.achievedMark;
      vb = b.achievedMark;
    } else if (sortBy === 'studentId') {
      va = a.student.stdRegNo || '';
      vb = b.student.stdRegNo || '';
    } else {
      va = 0;
      vb = 0;
    }
    if (va < vb) return order === 'asc' ? -1 : 1;
    if (va > vb) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const totalItems = rows.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const start = (page - 1) * limit;
  const paged = rows.slice(start, start + limit);

  const someWeeksMissingMarks = isOverall ? weeksWithMarks.size > 0 && weeksWithMarks.size < 4 : false;

  return {
    meta: { totalItems, totalPages, currentPage: page },
    data: paged,
    routineTotal: routineTotal || null,
    routineFound,
    noMarksForWeek: !selectedWeekHasMarks,
    someWeeksMissingMarks,
  };
};
