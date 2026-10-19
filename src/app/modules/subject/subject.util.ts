import prisma from "../../../db/db.config";

/**
 * The class's subject list in canonical display order (sortOrder, then name).
 * Single source of truth for subject ordering on the result page, print view
 * and PDF output.
 */
export const orderedSubjectsForClass = async (classId: string) =>
  prisma.subject.findMany({
    where: { classId },
    orderBy: [{ sortOrder: "asc" }, { subjectName: "asc" }],
    select: { id: true, subjectName: true },
  });

/**
 * Sort subject rows by the class subject-list order. Rows whose subject is not
 * in the list go last, sorted by name, so old/orphaned marks are never dropped.
 */
export const sortRowsBySubjectOrder = <T extends { subjectName: string }>(
  rows: T[],
  orderedSubjects: { subjectName: string }[],
): T[] => {
  const orderIndex = new Map(orderedSubjects.map((s, i) => [s.subjectName, i]));
  return [...rows].sort((a, b) => {
    const ia = orderIndex.get(a.subjectName);
    const ib = orderIndex.get(b.subjectName);
    if (ia !== undefined && ib !== undefined) return ia - ib;
    if (ia !== undefined) return -1;
    if (ib !== undefined) return 1;
    return a.subjectName.localeCompare(b.subjectName);
  });
};
