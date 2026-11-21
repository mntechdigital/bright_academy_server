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

export type StudentGroup = "Science" | "Business" | "Humanity";

type GroupMap = Record<StudentGroup, string>;
type CombinedRowDef = {
  displayKey: string;
  map: GroupMap;
  aliases: Record<StudentGroup, string[]>;
  match: (parts: string[]) => boolean;
};

export const DEFAULT_SUBJECT_FULL_MARKS = 100;
export const SUBJECT_FULL_MARKS_BY_NORMALIZED_NAME: Readonly<Record<string, number>> = {
  ict: 50,
};

export function getDefaultFullMarksForSubject(subjectName?: string | null): number {
  const key = normalizeSubjectName(String(subjectName ?? ""));
  return SUBJECT_FULL_MARKS_BY_NORMALIZED_NAME[key] ?? DEFAULT_SUBJECT_FULL_MARKS;
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
export function getStudentGroup(regNo?: string | null): StudentGroup | "" {
  if (!regNo) return "";
  if (regNo.includes("66")) return "Science";
  if (regNo.includes("77")) return "Business";
  if (regNo.includes("55")) return "Humanity";
  return "";
}

const COMBINED_SUBJECT_ROWS: CombinedRowDef[] = [
  { displayKey: "chemistry/history/finance and banking", map: { Science: "Chemistry", Humanity: "History of Bangladesh and World Civilization", Business: "Finance and Banking" }, aliases: { Science: ["chemistry","chemestry"], Humanity: ["history and world culture","history of bangladesh and world civilization","history"], Business: ["finance and banking"] }, match: (p) => p.some(x=>x.includes("chemistry")||x.includes("chemestry")) && p.some(x=>x.includes("history")) && p.some(x=>x.includes("finance")||x.includes("banking")) },
  { displayKey: "physics/geography and environment/accounting", map: { Science: "Physics", Humanity: "Geography and Environment", Business: "Accounting" }, aliases: { Science: ["physics"], Humanity: ["geography and environment"], Business: ["accounting"] }, match: (p) => p.some(x=>x.includes("physics")) && p.some(x=>x.includes("geography")) && p.some(x=>x.includes("accounting")) },
  { displayKey: "general science/bangladesh and global studies", map: { Science: "Bangladesh and Global Studies", Humanity: "General Science", Business: "General Science" }, aliases: { Science: ["bangladesh and global studies"], Humanity: ["general science"], Business: ["general science"] }, match: (p) => p.some(x=>x.includes("general science")) && p.some(x=>x.includes("bangladesh")||x.includes("global studies")) },
  { displayKey: "biology/economics/civics/business entrepreneurship", map: { Science: "Biology", Humanity: "Civics / Economics", Business: "Business Entrepreneurship" }, aliases: { Science: ["biology"], Humanity: ["economics / civics","civics / economics","economics","civics"], Business: ["business entrepreneurship"] }, match: (p) => p.some(x=>x.includes("biology")) && p.some(x=>x.includes("civics")||x.includes("economics")) && p.some(x=>x.includes("entrepreneurship")) },
  { displayKey: "h. math/agriculture/h. science", map: { Science: "H. math/Agriculture/H. science", Humanity: "Agriculture / Home Science", Business: "Agriculture / Home Science" }, aliases: { Science: ["higher mathematics","h. math"], Humanity: ["agriculture / home science","agriculture"], Business: ["agriculture / home science","agriculture"] }, match: (p) => p.some(x=>x.includes("h. math")||x.includes("higher math")||x.includes("higher mathematics")) && p.some(x=>x.includes("agriculture")) && p.some(x=>x.includes("h. science")||x.includes("home science")||x.includes("home economics")) },
];

function getCombinedRowDef(rowLabel: string): CombinedRowDef | undefined {
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
    for (const alias of entry.aliases[group as StudentGroup] || []) {
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
    for (const g of ["Science","Business","Humanity"] as StudentGroup[]) {
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

function getGradeFromMarks(marks: number, fullMarks = 100): { gradePoint: number; letterGrade: string } {
  if (fullMarks <= 0) return { gradePoint: 0, letterGrade: "F" };
  for (const g of GRADE_SYSTEM_100) {
    if (marks >= g.minMark && marks <= g.maxMark) return { gradePoint: g.gradePoint, letterGrade: g.grade };
  }
  return { gradePoint: 0, letterGrade: "F" };
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
  if (row?.marks !== undefined && row?.marks !== null && row?.marks !== "") return toNumber(row.marks, 0);
  if (row?.marksObtained !== undefined && row?.marksObtained !== null && row?.marksObtained !== "") return toNumber(row.marksObtained, 0);
  return 0;
};
const getResultFullMarks = (row: any, subjectName?: string | null) => {
  const subjectDefault = getDefaultFullMarksForSubject(subjectName ?? row?.subjectName);
  if (subjectDefault !== DEFAULT_SUBJECT_FULL_MARKS) return subjectDefault;
  const n = Number(row?.fullMarks);
  return Number.isFinite(n) && n > 0 ? n : subjectDefault;
};

export function computeMonthlyResultSummary(args: {
  resultSubjects?: any[] | null;
  classSubjects?: any[] | null;
  group?: string | null;
  classNumber?: string | number | null;
  fallbackTotalMarks?: number | null;
}) {
  const { resultSubjects = [], classSubjects = [], group = "", classNumber, fallbackTotalMarks } = args;
  const normalized = (resultSubjects || []).map((row) => {
    const originalName = String(row?.subjectName ?? "").trim();
    const canonical = isClass9Or10(classNumber) && group ? getCanonicalCombinedName(originalName, group, classNumber) : null;
    const canonicalName = canonical || originalName;
    return {
      raw: row,
      originalName,
      canonicalName,
      key: normalizeSubjectName(canonicalName),
      marks: getResultMarks(row),
      fullMarks: getResultFullMarks(row, canonicalName || originalName),
      isCrossGroup: isCrossGroupLeftover(originalName, group || "", classNumber),
      meaningful: hasMeaningfulMarks(row),
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

  const excludedRows: any[] = [];

  if (studentSubjects.length > 0) {
    for (const s of studentSubjects) {
      const name = String(s.subjectName ?? s.name ?? "").trim();
      const key = normalizeSubjectName(name);
      const candidates = byKey.get(key) || [];
      const match = candidates.find(c => !c.isCrossGroup) || candidates[0];
      obtained += match ? match.marks : 0;
      full += getResultFullMarks(s || match?.raw);
      used.add(key);
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
        used.add(r.key);
      }
    }
  } else {
    for (const r of normalized) {
      if (used.has(r.key)) continue;
      if (r.isCrossGroup && !r.meaningful) continue;
      obtained += r.marks;
      full += r.fullMarks;
      used.add(r.key);
    }
    if (full === 0 && fallbackTotalMarks && fallbackTotalMarks > 0) full = fallbackTotalMarks;
  }

  return { ...getMonthlyGpaGradeFromTotals(obtained, full), excludedRows, subjectCount: studentSubjects.length || normalized.length };
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
  });
  r.totalMarks = summary.full;
  r.gpa = summary.gpa;
  r.grade = summary.grade;
  r._computed = { obtained: summary.obtained, full: summary.full, percentage: summary.percentage, group, subjectCount: summary.subjectCount };
  return r;
}
