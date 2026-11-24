type StudentGroup = "Science" | "Business" | "Humanity";
import { orderedSubjectsForClass } from "../modules/subject/subject.util";

export const GRADE_SYSTEM_100 = [
  { minMark: 80, maxMark: 100, grade: "A+", gradePoint: 5 },
  { minMark: 70, maxMark: 79, grade: "A", gradePoint: 4 },
  { minMark: 60, maxMark: 69, grade: "A-", gradePoint: 3.5 },
  { minMark: 50, maxMark: 59, grade: "B", gradePoint: 3 },
  { minMark: 40, maxMark: 49, grade: "C", gradePoint: 2 },
  { minMark: 33, maxMark: 39, grade: "D", gradePoint: 1 },
  { minMark: 0, maxMark: 32, grade: "F", gradePoint: 0 },
];

// ICT practical rule cutoff (Asia/Dhaka, UTC+6). Results created at/after this
// moment follow the new ICT rule; older results keep stored values unchanged.
// Change this single constant to adjust the rollout boundary.
export const ICT_PRACTICAL_CUTOFF: Date = new Date("2026-11-22T00:00:00+06:00");
export const DEFAULT_SUBJECT_FULL_MARKS = 100;
export const SUBJECT_FULL_MARKS_BY_NORMALIZED_NAME: Readonly<Record<string, number>> = { ict: 50 };

export function isClass6To8(classNumber?: string | number | null): boolean {
  if (classNumber === undefined || classNumber === null || classNumber === "") return false;
  const match = String(classNumber).match(/\d+/);
  if (!match) return false;
  const num = Number(match[0]);
  return num >= 6 && num <= 8;
}

export function isClass6To8FiftyMarkSubject(subjectName?: string | null): boolean {
  const key = normalizeSubjectName(String(subjectName ?? ""));
  if (
    key === "bangla 2nd paper" ||
    key === "bangla 2nd" ||
    key === "bangla second paper" ||
    key.includes("bangla 2nd") ||
    key.includes("bangla second")
  ) {
    return true;
  }
  if (
    key === "english 2nd paper" ||
    key === "english 2nd" ||
    key === "english second paper" ||
    key.includes("english 2nd") ||
    key.includes("english second")
  ) {
    return true;
  }
  if (
    key === "agriculture / home science" ||
    key === "agriculture/home science" ||
    key === "agriculture" ||
    key === "home science" ||
    key === "agriculture studies" ||
    key === "krishi" ||
    key === "garhasthya"
  ) {
    return true;
  }
  return false;
}

export function getDefaultFullMarksForSubject(
  subjectName?: string | null,
  classNumber?: string | number | null,
): number {
  const key = normalizeSubjectName(String(subjectName ?? ""));
  if (key === "ict") return ICT_FULL_MARKS;
  if (isClass6To8(classNumber) && isClass6To8FiftyMarkSubject(subjectName)) {
    return 50;
  }
  return SUBJECT_FULL_MARKS_BY_NORMALIZED_NAME[key] ?? DEFAULT_SUBJECT_FULL_MARKS;
}

// ICT rule (class 9/10, any group): exam max 25, pass >= 9 => practical mirrors exam; fail/absent no practical.
export const ICT_FULL_MARKS = 50;
export const ICT_EXAM_MAX = 25;
export const ICT_EXAM_PASS_MARK = 9;
// Science practical rule (class 9/10, Science group only): exam max 75, pass >= 25 => +20 practical; fail/absent no practical.
export const SCIENCE_FULL_MARKS = 100;
export const SCIENCE_EXAM_MAX = 75;
export const SCIENCE_EXAM_PASS_MARK = 25;
export const SCIENCE_PRACTICAL_ADDED = 20; // out of 25, only 20 added

export interface PracticalComputedMarks {
  exam: number;
  practical: number;
  total: number;
  examMax: number;
  fullMarks: number;
  passMark: number;
  practicalAdded: number;
  applicable: boolean;
}

export type PracticalSubjectSlot =
  | "ict"
  | "science-physics"
  | "science-chemistry"
  | "science-biology"
  | "science-higher-math"
  | "science-agriculture"
  | "science-home-science"
  | null;

const SCIENCE_PRACTICAL_SUBJECT_KEYS = new Set(["physics", "chemistry", "biology"]);

export function isAgriculturePracticalKey(key: string): boolean {
  return (
    key === "agriculture" ||
    key === "agriculture studies" ||
    key === "agriculture / home science" ||
    key === "agriculture/home science" ||
    key === "krishi" ||
    key === "krishi shiksha"
  );
}

export function isHomeSciencePracticalKey(key: string): boolean {
  return (
    key === "home science" ||
    key === "home economics" ||
    key === "h. science" ||
    key === "h.science" ||
    key === "garhasthya" ||
    key === "garhasthya biggan"
  );
}

export function getGroupResolvedSubjectName(
  subjectName: string | null | undefined,
  group: string | null | undefined,
  classNumber?: string | number | null,
): string {
  const original = String(subjectName ?? "").trim();
  if (!isClass9Or10(classNumber) || !group) return original;
  if (group !== "Science" && group !== "Business" && group !== "Humanity") return original;
  const canonical = getCanonicalCombinedName(original, group, classNumber);
  if (!canonical) return original;
  const def = COMBINED_SUBJECT_ROWS.find((d) => d.displayKey === canonical);
  if (!def) return original;
  return def.map[group as StudentGroup] || original;
}

export function getPracticalSubjectSlot(
  subjectName: string | null | undefined,
  group: string | null | undefined,
  classNumber?: string | number | null,
): PracticalSubjectSlot {
  if (!isClass9Or10(classNumber)) return null;
  const resolved = getGroupResolvedSubjectName(subjectName, group, classNumber);
  const key = normalizeSubjectName(resolved);
  if (key === "ict") return "ict";
  if (group === "Science") {
    if (SCIENCE_PRACTICAL_SUBJECT_KEYS.has(key)) return `science-${key}` as PracticalSubjectSlot;
    // Higher math row: canonical for Science is "H. math/Agriculture/H. science"
    if (
      key === "higher mathematics" ||
      key === "higher math" ||
      key === "h. math" ||
      key === "h. math/agriculture/h. science"
    ) {
      return "science-higher-math";
    }
  }
  if (isAgriculturePracticalKey(key) || key === "h. math/agriculture/h. science") {
    return "science-agriculture";
  }
  if (isHomeSciencePracticalKey(key)) {
    return "science-home-science";
  }
  return null;
}

export function isSciencePracticalSubject(
  subjectName: string | null | undefined,
  group: string | null | undefined,
  classNumber?: string | number | null,
): boolean {
  const slot = getPracticalSubjectSlot(subjectName, group, classNumber);
  return !!slot && slot !== "ict";
}

export function isMonthlyResultNewForPractical(
  createdAt?: string | Date | null,
  cutoff: Date = ICT_PRACTICAL_CUTOFF,
): boolean {
  if (!createdAt) return false;
  const t = createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime();
  return Number.isFinite(t) && t >= cutoff.getTime();
}

export function isIctPracticalApplicable(
  classNumber?: string | number | null,
  createdAt?: string | Date | null,
  cutoff: Date = ICT_PRACTICAL_CUTOFF,
): boolean {
  return isClass9Or10(classNumber) && isMonthlyResultNewForPractical(createdAt, cutoff);
}

export function isSciencePracticalApplicable(
  subjectName: string | null | undefined,
  group: string | null | undefined,
  classNumber?: string | number | null,
  createdAt?: string | Date | null,
  cutoff: Date = ICT_PRACTICAL_CUTOFF,
): boolean {
  return isSciencePracticalSubject(subjectName, group, classNumber) && isMonthlyResultNewForPractical(createdAt, cutoff);
}

export function isPracticalApplicable(
  subjectName: string | null | undefined,
  group: string | null | undefined,
  classNumber?: string | number | null,
  createdAt?: string | Date | null,
  cutoff: Date = ICT_PRACTICAL_CUTOFF,
): boolean {
  const slot = getPracticalSubjectSlot(subjectName, group, classNumber);
  if (!slot) return false;
  if (slot === "ict") return isIctPracticalApplicable(classNumber, createdAt, cutoff);
  return isSciencePracticalApplicable(subjectName, group, classNumber, createdAt, cutoff);
}

export function computeIct(
  examMark: number | null | undefined,
  isAbsent: boolean,
): PracticalComputedMarks {
  if (isAbsent) {
    return { exam: 0, practical: 0, total: 0, examMax: ICT_EXAM_MAX, fullMarks: ICT_FULL_MARKS, passMark: ICT_EXAM_PASS_MARK, practicalAdded: ICT_EXAM_MAX, applicable: true };
  }
  const exam = Math.max(0, Math.min(ICT_EXAM_MAX, Number(examMark) || 0));
  if (exam >= ICT_EXAM_PASS_MARK) {
    return { exam, practical: exam, total: exam * 2, examMax: ICT_EXAM_MAX, fullMarks: ICT_FULL_MARKS, passMark: ICT_EXAM_PASS_MARK, practicalAdded: ICT_EXAM_MAX, applicable: true };
  }
  return { exam, practical: 0, total: exam, examMax: ICT_EXAM_MAX, fullMarks: ICT_FULL_MARKS, passMark: ICT_EXAM_PASS_MARK, practicalAdded: ICT_EXAM_MAX, applicable: true };
}

export function computeSciencePractical(
  examMark: number | null | undefined,
  isAbsent: boolean,
): PracticalComputedMarks {
  if (isAbsent) {
    return { exam: 0, practical: 0, total: 0, examMax: SCIENCE_EXAM_MAX, fullMarks: SCIENCE_FULL_MARKS, passMark: SCIENCE_EXAM_PASS_MARK, practicalAdded: SCIENCE_PRACTICAL_ADDED, applicable: true };
  }
  const exam = Math.max(0, Math.min(SCIENCE_EXAM_MAX, Number(examMark) || 0));
  if (exam >= SCIENCE_EXAM_PASS_MARK) {
    return { exam, practical: SCIENCE_PRACTICAL_ADDED, total: exam + SCIENCE_PRACTICAL_ADDED, examMax: SCIENCE_EXAM_MAX, fullMarks: SCIENCE_FULL_MARKS, passMark: SCIENCE_EXAM_PASS_MARK, practicalAdded: SCIENCE_PRACTICAL_ADDED, applicable: true };
  }
  return { exam, practical: 0, total: exam, examMax: SCIENCE_EXAM_MAX, fullMarks: SCIENCE_FULL_MARKS, passMark: SCIENCE_EXAM_PASS_MARK, practicalAdded: SCIENCE_PRACTICAL_ADDED, applicable: true };
}

export function computePractical(
  subjectSlot: PracticalSubjectSlot | string | null | undefined,
  group: string | null | undefined,
  classNumber: string | number | null | undefined,
  examMark: number | null | undefined,
  isAbsent: boolean,
): PracticalComputedMarks {
  void group; void classNumber;
  if (subjectSlot === "ict") return computeIct(examMark, isAbsent);
  if (typeof subjectSlot === "string" && subjectSlot.startsWith("science-")) return computeSciencePractical(examMark, isAbsent);
  const exam = isAbsent ? 0 : Math.max(0, Number(examMark) || 0);
  return { exam, practical: 0, total: exam, examMax: exam, fullMarks: exam, passMark: 0, practicalAdded: 0, applicable: false };
}

export function isIctSubject(subjectName?: string | null): boolean {
  return normalizeSubjectName(String(subjectName ?? "")) === "ict";
}

export function isMonthlyResultNewForIct(
  createdAt?: string | Date | null,
  cutoff: Date = ICT_PRACTICAL_CUTOFF,
): boolean {
  return isMonthlyResultNewForPractical(createdAt, cutoff);
}

export function getIctStoredTotalFromExam(
  examMark: number | null | undefined,
  isAbsent: boolean,
): number {
  return computeIct(examMark, isAbsent).total;
}

export function getIctExamFromStoredTotal(
  storedTotal: number | null | undefined,
  isAbsent: boolean,
): number | null {
  if (isAbsent) return null;
  const total = Number(storedTotal);
  if (!Number.isFinite(total) || total <= 0) return null;
  const normalized = Math.max(0, Math.min(ICT_FULL_MARKS, total));
  const isPassTotal =
    normalized % 2 === 0 &&
    normalized >= ICT_EXAM_PASS_MARK * 2 &&
    normalized <= ICT_EXAM_MAX * 2;
  if (isPassTotal) return normalized / 2;
  return Math.max(0, Math.min(ICT_EXAM_MAX, normalized));
}

export function getScienceStoredTotalFromExam(
  examMark: number | null | undefined,
  isAbsent: boolean,
): number {
  return computeSciencePractical(examMark, isAbsent).total;
}

export function getScienceExamFromStoredTotal(
  storedTotal: number | null | undefined,
  isAbsent: boolean,
): number | null {
  if (isAbsent) return null;
  const total = Number(storedTotal);
  if (!Number.isFinite(total) || total <= 0) return null;
  const normalized = Math.max(0, Math.min(SCIENCE_FULL_MARKS, total));
  // New pass totals: exam+20, exam 25..75 => 45..95. Old pass totals (legacy +25 style, if any) may be exam+25 => 50..100.
  // Prefer new rule: if total is in 45..95 and total-20 in 25..75, treat as pass with +20.
  if (normalized >= SCIENCE_EXAM_PASS_MARK + SCIENCE_PRACTICAL_ADDED && normalized <= SCIENCE_EXAM_MAX + SCIENCE_PRACTICAL_ADDED) {
    return normalized - SCIENCE_PRACTICAL_ADDED;
  }
  // Fallback: treat as failed exam mark.
  return Math.max(0, Math.min(SCIENCE_EXAM_MAX, normalized));
}

export function getPracticalStoredTotalFromExam(
  subjectName: string | null | undefined,
  group: string | null | undefined,
  classNumber: string | number | null | undefined,
  examMark: number | null | undefined,
  isAbsent: boolean,
): number {
  const slot = getPracticalSubjectSlot(subjectName, group, classNumber);
  return computePractical(slot, group, classNumber, examMark, isAbsent).total;
}

export function getPracticalExamFromStoredTotal(
  subjectName: string | null | undefined,
  group: string | null | undefined,
  classNumber: string | number | null | undefined,
  storedTotal: number | null | undefined,
  isAbsent: boolean,
): number | null {
  const slot = getPracticalSubjectSlot(subjectName, group, classNumber);
  if (slot === "ict") return getIctExamFromStoredTotal(storedTotal, isAbsent);
  if (slot && slot.startsWith("science-")) return getScienceExamFromStoredTotal(storedTotal, isAbsent);
  if (isAbsent) return null;
  const total = Number(storedTotal);
  return Number.isFinite(total) ? total : null;
}
function normalizeSubjectName(name: string): string {
  return String(name ?? "")
    .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, " ")
    .replace(/&/gi, " and ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
function splitParts(rowLabel: string): string[] {
  return String(rowLabel ?? "")
    .split(/[\/\u2215\u2044\uFF0F]/)
    .map(normalizeSubjectName)
    .filter(Boolean);
}
function normalizeRowLabel(rowLabel: string): string { return splitParts(rowLabel).join("/"); }
function partsKey(rowLabel: string): string { return [...splitParts(rowLabel)].sort().join("||"); }
function isClass9Or10(classNumber?: string | number | null): boolean {
  if (classNumber === undefined || classNumber === null || classNumber === "") return false;
  const match = String(classNumber).match(/\d+/);
  if (!match) return false;
  const num = Number(match[0]);
  return num === 9 || num === 10;
}

export function isSubjectAbsent(row: any): boolean {
  if (!row) return false;
  // Explicit marker (least invasive): isAbsent true means the student was absent
  // for that subject. marks=0 alone is treated as a real zero, not absence.
  if (row.isAbsent === true || row.isAbsent === "true" || row.isAbsent === 1) return true;
  return false;
}
export function getStudentGroup(regNo?: string | null): "Science" | "Business" | "Humanity" | "" {
  if (!regNo) return "";
  if (regNo.includes("66")) return "Science";
  if (regNo.includes("77")) return "Business";
  if (regNo.includes("55")) return "Humanity";
  return "";
}

const COMBINED_SUBJECT_ROWS: any[] = [
  { displayKey: "chemistry/history/finance and banking", map: { Science: "Chemistry", Humanity: "History of Bangladesh and World Civilization", Business: "Finance and Banking" }, aliases: { Science: ["chemistry","chemestry"], Humanity: ["history and world culture","history of bangladesh and world civilization","history"], Business: ["finance and banking"] }, match: (p: string[]) => p.some((x: string)=>x.includes("chemistry")||x.includes("chemestry")) && p.some(x=>x.includes("history")) && p.some(x=>x.includes("finance")||x.includes("banking")) },
  { displayKey: "physics/geography and environment/accounting", map: { Science: "Physics", Humanity: "Geography and Environment", Business: "Accounting" }, aliases: { Science: ["physics"], Humanity: ["geography and environment"], Business: ["accounting"] }, match: (p: string[]) => p.some((x: string)=>x.includes("physics")) && p.some(x=>x.includes("geography")) && p.some(x=>x.includes("accounting")) },
  { displayKey: "general science/bangladesh and global studies", map: { Science: "Bangladesh and Global Studies", Humanity: "General Science", Business: "General Science" }, aliases: { Science: ["bangladesh and global studies"], Humanity: ["general science"], Business: ["general science"] }, match: (p: string[]) => p.some((x: string)=>x.includes("general science")) && p.some(x=>x.includes("bangladesh")||x.includes("global studies")) },
  { displayKey: "biology/economics/civics/business entrepreneurship", map: { Science: "Biology", Humanity: "Civics / Economics", Business: "Business Entrepreneurship" }, aliases: { Science: ["biology"], Humanity: ["economics / civics","civics / economics","economics","civics"], Business: ["business entrepreneurship"] }, match: (p: string[]) => p.some((x: string)=>x.includes("biology")) && p.some(x=>x.includes("civics")||x.includes("economics")) && p.some(x=>x.includes("entrepreneurship")) },
  { displayKey: "h. math/agriculture/h. science", map: { Science: "H. math/Agriculture/H. science", Humanity: "Agriculture / Home Science", Business: "Agriculture / Home Science" }, aliases: { Science: ["higher mathematics","h. math"], Humanity: ["agriculture / home science","agriculture"], Business: ["agriculture / home science","agriculture"] }, match: (p: string[]) => p.some((x: string)=>x.includes("h. math")||x.includes("higher math")||x.includes("higher mathematics")) && p.some(x=>x.includes("agriculture")) && p.some(x=>x.includes("h. science")||x.includes("home science")||x.includes("home economics")) },
];

function getCombinedRowDef(rowLabel: string): any {
  const normalized = normalizeRowLabel(rowLabel);
  const pKey = partsKey(rowLabel);
  const parts = splitParts(rowLabel);
  return COMBINED_SUBJECT_ROWS.find(e => normalizeRowLabel(e.displayKey) === normalized)
    || COMBINED_SUBJECT_ROWS.find(e => partsKey(e.displayKey) === pKey)
    || COMBINED_SUBJECT_ROWS.find(e => e.match(parts));
}
function aliasMatches(storedNorm: string, aliasNorm: string): boolean {
  if (!storedNorm || !aliasNorm) return false;
  if (storedNorm === aliasNorm) return true;
  if (aliasNorm.includes("/")) {
    const aliasParts = aliasNorm.split("/").map(p=>p.trim()).filter(Boolean);
    const storedParts = storedNorm.split("/").map(p=>p.trim()).filter(Boolean);
    if (aliasParts.length > 1 && aliasParts.every(p => storedParts.includes(p) || storedNorm.includes(p))) return true;
  }
  if (aliasNorm === "history") return storedNorm.includes("history");
  if (aliasNorm === "economics") return storedNorm === "economics";
  if (aliasNorm === "civics") return storedNorm === "civics";
  if (aliasNorm === "agriculture") return storedNorm === "agriculture";
  return false;
}
function getCanonicalCombinedName(rowLabel: string, group: string, classNumber?: string | number | null): string | null {
  if (!isClass9Or10(classNumber)) return null;
  if (group !== "Science" && group !== "Business" && group !== "Humanity") return null;
  const def = getCombinedRowDef(rowLabel);
  if (def) return def.displayKey;
  const storedNorm = normalizeSubjectName(rowLabel);
  for (const entry of COMBINED_SUBJECT_ROWS) {
    for (const alias of entry.aliases[group as "Science"|"Business"|"Humanity"] || []) {
      if (aliasMatches(storedNorm, normalizeSubjectName(alias))) return entry.displayKey;
    }
  }
  return null;
}
function isCrossGroupLeftover(storedName: string, group: string, classNumber?: string | number | null): boolean {
  if (!isClass9Or10(classNumber)) return false;
  if (group !== "Science" && group !== "Business" && group !== "Humanity") return false;
  if (getCanonicalCombinedName(storedName, group, classNumber)) return false;
  const storedNorm = normalizeSubjectName(storedName);
  for (const entry of COMBINED_SUBJECT_ROWS) {
    for (const g of ["Science","Business","Humanity"] as Array<"Science"|"Business"|"Humanity">) {
      if (g === group) continue;
      for (const alias of entry.aliases[g] || []) {
        if (aliasMatches(storedNorm, normalizeSubjectName(alias))) return true;
      }
    }
  }
  return false;
}
function hasMeaningfulMarks(row: any): boolean {
  if (!row) return false;
  const marks = row.marks ?? row.obtainedMarks;
  if (marks != null && Number(marks) !== 0) return true;
  const point = row.point ?? row.gpa;
  if (point != null && Number(point) !== 0) return true;
  const grade = row.grade;
  if (grade != null && String(grade).trim() !== "" && String(grade).trim().toUpperCase() !== "F") return true;
  return false;
}

export function resolveStudentGroupSubjects<T extends { subjectName?: string; name?: string }>(
  classSubjects: T[], group: string, classNumber?: string | number | null,
): T[] {
  if (!Array.isArray(classSubjects) || classSubjects.length === 0) return [];
  if (!isClass9Or10(classNumber)) return [...classSubjects];
  if (group !== "Science" && group !== "Business" && group !== "Humanity") return [...classSubjects];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const subject of classSubjects) {
    const name = String(subject.subjectName ?? subject.name ?? "").trim();
    if (!name) continue;
    const canonical = getCanonicalCombinedName(name, group, classNumber);
    if (canonical) {
      const def = COMBINED_SUBJECT_ROWS.find(d => d.displayKey === canonical);
      if (!def || seen.has(def.displayKey)) continue;
      seen.add(def.displayKey);
      out.push({ ...subject, subjectName: def.displayKey, name: def.displayKey } as T);
      continue;
    }
    if (isCrossGroupLeftover(name, group, classNumber)) continue;
    out.push(subject);
  }
  return out;
}

const GRADE_SYSTEM_50 = [
  { minMark: 40, maxMark: 50, grade: "A+", gradePoint: 5 },
  { minMark: 35, maxMark: 39, grade: "A", gradePoint: 4 },
  { minMark: 30, maxMark: 34, grade: "A-", gradePoint: 3.5 },
  { minMark: 25, maxMark: 29, grade: "B", gradePoint: 3 },
  { minMark: 20, maxMark: 24, grade: "C", gradePoint: 2 },
  { minMark: 17, maxMark: 19, grade: "D", gradePoint: 1 },
  { minMark: 0, maxMark: 16, grade: "F", gradePoint: 0 },
];

function getGradeFromMarks(marks: number, fullMarks = 100): { gradePoint: number; letterGrade: string } {
  if (fullMarks <= 0) return { gradePoint: 0, letterGrade: "F" };
  const system = fullMarks === 50 ? GRADE_SYSTEM_50 : GRADE_SYSTEM_100;
  for (const g of system) {
    if (marks >= g.minMark && marks <= g.maxMark) return { gradePoint: g.gradePoint, letterGrade: g.grade };
  }
  return { gradePoint: 0, letterGrade: "F" };
}

export function getGradeFromGPA(gpa: number): string {
  if (gpa >= 5.0) return "A+";
  if (gpa >= 4.0) return "A";
  if (gpa >= 3.5) return "A-";
  if (gpa >= 3.0) return "B";
  if (gpa >= 2.0) return "C";
  if (gpa >= 1.0) return "D";
  return "F";
}

export function getMonthlyGpaGradeFromTotals(totalObtained: number, totalFull: number) {
  const safeObtained = Number.isFinite(totalObtained) ? Math.max(0, totalObtained) : 0;
  const safeFull = Number.isFinite(totalFull) && totalFull > 0 ? totalFull : 0;
  if (safeFull <= 0) return { gpa: 0, grade: "F", percentage: 0, obtained: safeObtained, full: 0 };
  const percentage = Math.min(100, Math.floor((safeObtained / safeFull) * 100));
  const { gradePoint, letterGrade } = getGradeFromMarks(percentage, 100);
  return { gpa: gradePoint, grade: letterGrade, percentage, obtained: safeObtained, full: safeFull };
}

const toNumber = (v: unknown, fallback = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };
const getResultMarks = (row: any) => {
  if (isSubjectAbsent(row)) return 0;
  if (row?.marks !== undefined && row?.marks !== null && row?.marks !== "") return toNumber(row.marks, 0);
  if (row?.marksObtained !== undefined && row?.marksObtained !== null && row?.marksObtained !== "") return toNumber(row.marksObtained, 0);
  return 0;
};
const getResultFullMarks = (row: any, subjectName?: string | null, classNumber?: string | number | null) => {
  const subjectDefault = getDefaultFullMarksForSubject(subjectName ?? row?.subjectName, classNumber);
  const key = normalizeSubjectName(String(subjectName ?? row?.subjectName ?? ""));
  if (key === "ict") return ICT_FULL_MARKS;
  const n = Number(row?.fullMarks);
  return Number.isFinite(n) && n > 0 ? n : subjectDefault;
};



export function getIctMaxInputMarks(
  classNumber?: string | number | null,
  createdAt?: string | Date | null,
  cutoff: Date = ICT_PRACTICAL_CUTOFF,
): number {
  if (isIctSubject(classNumber as any)) return ICT_FULL_MARKS; // never used; guard
  return ICT_FULL_MARKS;
}

export function getIctInputMaxForContext(
  classNumber?: string | number | null,
  createdAt?: string | Date | null,
  cutoff: Date = ICT_PRACTICAL_CUTOFF,
): number {
  return isIctPracticalApplicable(classNumber, createdAt, cutoff) ? ICT_EXAM_MAX : ICT_FULL_MARKS;
}

export function computeMonthlyResultSummary(args: {
  resultSubjects?: any[] | null;
  classSubjects?: any[] | null;
  group?: string | null;
  classNumber?: string | number | null;
  fallbackTotalMarks?: number | null;
  createdAt?: string | Date | null;
  ictCutoff?: Date;
}) {
  const { resultSubjects = [], classSubjects = [], group = "", classNumber, fallbackTotalMarks, createdAt, ictCutoff = ICT_PRACTICAL_CUTOFF } = args;
  const normalized = (resultSubjects || []).map((row) => {
    const originalName = String(row?.subjectName ?? "").trim();
    const canonical = isClass9Or10(classNumber) && group ? getCanonicalCombinedName(originalName, group, classNumber) : null;
    const canonicalName = canonical || originalName;
    const slot = getPracticalSubjectSlot(canonicalName || originalName, group, classNumber);
    const practicalApplicable = !!slot && isPracticalApplicable(canonicalName || originalName, group, classNumber, createdAt, ictCutoff);
    return {
      raw: row,
      originalName,
      canonicalName,
      key: normalizeSubjectName(canonicalName),
      marks: getResultMarks(row),
      fullMarks: getResultFullMarks(row, canonicalName || originalName, classNumber),
      isCrossGroup: isCrossGroupLeftover(originalName, group || "", classNumber),
      meaningful: hasMeaningfulMarks(row),
      isAbsent: isSubjectAbsent(row),
      practicalApplicable, slot,
    };
  });
  const byKey = new Map<string, typeof normalized>();
  for (const r of normalized) {
    if (!r.key) continue;
    const arr = byKey.get(r.key) || [];
    arr.push(r);
    byKey.set(r.key, arr);
  }

  const studentSubjects = resolveStudentGroupSubjects(classSubjects || [], group || "", classNumber);
  const used = new Set<string>();
  let obtained = 0;
  let full = 0;
  const countedPoints: number[] = [];
  let hasFailedOrAbsentSubject = false;

  const excludedRows: any[] = [];

  if (studentSubjects.length > 0) {
    for (const s of studentSubjects) {
      const name = String(s.subjectName ?? s.name ?? "").trim();
      const key = normalizeSubjectName(name);
      const candidates = byKey.get(key) || [];
      const match = candidates.find(c => !c.isCrossGroup) || candidates[0];
      const slot = getPracticalSubjectSlot(name, group, classNumber); const practicalApplicable = !!slot && isPracticalApplicable(name, group, classNumber, createdAt, ictCutoff);
      const rowMarks = match ? match.marks : 0;
      const rowFull = slot === "ict" ? ICT_FULL_MARKS : (slot && slot.startsWith("science-") ? SCIENCE_FULL_MARKS : (match ? match.fullMarks : getResultFullMarks(s, name, classNumber)));
      obtained += rowMarks;
      full += rowFull;
      const absent = match ? isSubjectAbsent(match.raw) : false;
      const gradeInfo = (!absent && match && match.marks !== null && match.marks !== undefined && rowFull > 0)
        ? getGradeFromMarks(rowMarks, rowFull)
        : { gradePoint: 0, letterGrade: "F" };
      const point = (match && match.raw?.point !== undefined && match.raw?.point !== null && match.raw?.point !== "")
        ? Number(match.raw.point)
        : (match && match.marks !== null ? gradeInfo.gradePoint : 0);
      const grade = (match && match.raw?.grade !== undefined && match.raw?.grade !== null && String(match.raw?.grade).trim() !== "")
        ? String(match.raw.grade)
        : gradeInfo.letterGrade;
      countedPoints.push(point);
      used.add(key);
      if (absent || point === 0 || String(grade ?? "").trim().toUpperCase() === "F" || !match || match.marks === null || match.marks === undefined) {
        hasFailedOrAbsentSubject = true;
      }
    }
    // Class 9/10 known-group rule: denominator is ALWAYS group slots x fullMarks.
    // Rows outside the student's group are excluded from obtained/full and reported separately.
    if (isClass9Or10(classNumber) && (group === "Science" || group === "Business" || group === "Humanity")) {
      for (const r of normalized) {
        if (used.has(r.key)) continue;
        excludedRows.push({
          id: r.raw?.id ?? null,
          subjectName: r.originalName,
          marks: r.marks,
          fullMarks: r.fullMarks,
          reason: "outside-group",
        });
        used.add(r.key);
      }
    } else {
      for (const r of normalized) {
        if (used.has(r.key)) continue;
        if (!r.meaningful) continue;
        obtained += r.marks;
        full += r.fullMarks;
        const absent = isSubjectAbsent(r.raw);
        const gradeInfo = (!absent && r.marks !== null && r.marks !== undefined && r.fullMarks > 0)
          ? getGradeFromMarks(r.marks, r.fullMarks)
          : { gradePoint: 0, letterGrade: "F" };
        const point = (r.raw?.point !== undefined && r.raw?.point !== null && r.raw?.point !== "")
          ? Number(r.raw.point)
          : gradeInfo.gradePoint;
        const grade = (r.raw?.grade !== undefined && r.raw?.grade !== null && String(r.raw?.grade).trim() !== "")
          ? String(r.raw.grade)
          : gradeInfo.letterGrade;
        countedPoints.push(point);
        used.add(r.key);
        if (absent || point === 0 || String(grade ?? "").trim().toUpperCase() === "F") {
          hasFailedOrAbsentSubject = true;
        }
      }
    }
  } else {
    for (const r of normalized) {
      if (used.has(r.key)) continue;
      if (r.isCrossGroup && !r.meaningful) continue;
      obtained += r.marks;
      full += r.fullMarks;
      const absent = isSubjectAbsent(r.raw);
      const gradeInfo = (!absent && r.marks !== null && r.marks !== undefined && r.fullMarks > 0)
        ? getGradeFromMarks(r.marks, r.fullMarks)
        : { gradePoint: 0, letterGrade: "F" };
      const point = (r.raw?.point !== undefined && r.raw?.point !== null && r.raw?.point !== "")
        ? Number(r.raw.point)
        : gradeInfo.gradePoint;
      const grade = (r.raw?.grade !== undefined && r.raw?.grade !== null && String(r.raw?.grade).trim() !== "")
        ? String(r.raw.grade)
        : gradeInfo.letterGrade;
      countedPoints.push(point);
      used.add(r.key);
      if (absent || point === 0 || String(grade ?? "").trim().toUpperCase() === "F") {
        hasFailedOrAbsentSubject = true;
      }
    }
    if (full === 0 && fallbackTotalMarks && fallbackTotalMarks > 0) full = fallbackTotalMarks;
  }

  const subjectCount = studentSubjects.length > 0 ? studentSubjects.length : (countedPoints.length || normalized.length || 1);
  const totalPoints = countedPoints.reduce((sum, p) => sum + p, 0);
  const avgGpa = subjectCount > 0 ? totalPoints / subjectCount : 0;
  const gpa = Number(avgGpa.toFixed(2));
  const grade = hasFailedOrAbsentSubject ? "" : getGradeFromGPA(gpa);
  const safeFull = full > 0 ? full : 0;
  const percentage = safeFull > 0 ? Math.min(100, Math.floor((obtained / safeFull) * 100)) : 0;

  return {
    gpa,
    grade,
    percentage,
    obtained,
    full: safeFull,
    excludedRows,
    subjectCount,
  };
}

export async function computeAndApplyMonthlySummary<T extends any>(result: T): Promise<T> {
  if (!result) return result;
  const r: any = result;
  const classId = r.classId || r.student?.classId;
  const className = r.stdClass?.className || r.className || r.student?.stdClass?.className;
  const regNo = r.student?.stdRegNo;
  const group = getStudentGroup(regNo);
  let classSubjects: any[] = [];
  if (classId) {
    try { classSubjects = await orderedSubjectsForClass(classId); } catch { classSubjects = []; }
  }
  const summary = computeMonthlyResultSummary({
    resultSubjects: r.results || [],
    classSubjects,
    group,
    classNumber: className,
    fallbackTotalMarks: r.totalMarks,
    createdAt: r.createdAt,
  });
  r.totalMarks = summary.full;
  r.gpa = summary.gpa;
  r.grade = summary.grade;
  r._computed = { obtained: summary.obtained, full: summary.full, percentage: summary.percentage, group, subjectCount: summary.subjectCount };
  return r;
}
