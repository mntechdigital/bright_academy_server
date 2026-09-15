import prisma from "../../../db/db.config";
import { Prisma } from "@prisma/client";
import { builderQuery } from "../../builders/prismaBuilderQuery";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import configs from "../../configs";

const create = async (payload: any) => {
  const existingStudent = await prisma.student.findFirst({
    where: { stdRegNo: payload.stdRegNo },
  });

  if (existingStudent) {
    throw new Error(
      `A student with stdRegNo "${payload.stdRegNo}" already exists`,
    );
  }

  // password থাকলে hash করুন ✅
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 10);
  }

  return prisma.student.create({
    data: payload,
  });
};

const update = async (id: string, payload: any) => {
  await prisma.student.findUniqueOrThrow({ where: { id } });

  if (payload.stdRegNo) {
    const existingStudent = await prisma.student.findFirst({
      where: {
        stdRegNo: payload.stdRegNo,
        id: { not: id },
      },
    });

    if (existingStudent) {
      throw new Error("Registration number already exists");
    }

    payload.password = payload.stdRegNo;
  }

  // password update করলে নতুন hash করুন ✅
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 10);
  }

  return prisma.student.update({
    where: { id },
    data: {
      ...payload,
    },
  });
};

// Login service ✅ নতুন
const login = async (payload: { userId: string; password: string }) => {
  const student = await prisma.student.findFirst({
    where: { stdRegNo: payload.userId },
    include: {
      stdClass: true,
    },
  });

  if (!student) {
    throw new Error("Student পাওয়া যায়নি");
  }

  if (!student.password) {
    throw new Error("এই Student-এর password এখনো set করা হয়নি");
  }

  const isMatch = await bcrypt.compare(payload.password, student.password);
  if (!isMatch) {
    throw new Error("Password ভুল");
  }

  const token = jwt.sign(
    { studentId: student.id }, // ✅ studentId দিন
    configs.jwtAccessSecret as string, // ✅ আপনার existing configs ব্যবহার করুন
    { expiresIn: "7d" },
  );

  // password বাদ দিয়ে return করুন
  const { password, ...studentWithoutPassword } = student;

  return { token, student: studentWithoutPassword };
};

// নিজের result দেখার service ✅
const getMyResults = async (studentId: string) => {
  const monthlyResults = await prisma.monthlyExamResult.findMany({
    where: { studentId },
    include: { results: true },
    orderBy: { createdAt: "desc" },
  });

  const weeklyMarks = await prisma.weeklyMarksSheet.findMany({
    where: { studentId },
    include: { subject: true },
    orderBy: { createdAt: "desc" },
  });

  return { monthlyResults, weeklyMarks };
};



const getAll = async (query: Record<string, any>) => {
  // Support both:
  //  - URL-driven direct params: ?class=class-7&batch=B-4&gender=Female (and also ?classId=&batchId=)
  //  - Legacy filter JSON: ?filter={"classId":"...","batchId":"...","gender":"Female"}
  // Ensure params are not silently stripped: controller logs req.query, service logs normalizedFilter
  console.log("[studentService.getAll] incoming query:", query);
  let parsedFilter: Record<string, any> = {};
  if (query.filter) {
    try {
      parsedFilter = typeof query.filter === "string" ? JSON.parse(query.filter) : query.filter;
    } catch (e) {
      console.warn("[studentService.getAll] failed to parse filter JSON:", query.filter, e);
      parsedFilter = {};
    }
  }

  const classParam =
    query.class ?? query.classId ?? parsedFilter.class ?? parsedFilter.classId ?? parsedFilter.className;
  const batchParam =
    query.batch ?? query.batchId ?? parsedFilter.batch ?? parsedFilter.batchId ?? parsedFilter.batchName;
  const genderParam = query.gender ?? parsedFilter.gender;

  // Normalized filter that will be passed to builderQuery
  const normalizedFilter: Record<string, any> = { ...parsedFilter };
  // Remove ambiguous raw keys — we re-add them normalized below
  delete normalizedFilter.class;
  delete normalizedFilter.classId;
  delete normalizedFilter.className;
  delete normalizedFilter.batch;
  delete normalizedFilter.batchId;
  delete normalizedFilter.batchName;
  delete normalizedFilter.gender;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (classParam) {
    if (uuidRegex.test(classParam)) {
      normalizedFilter.classId = classParam;
    } else {
      // classParam is a className like "class-7" — filter via relation
      // Use case-insensitive equals to avoid mismatch (class-7 vs Class-7)
      normalizedFilter.stdClass = { className: { equals: classParam, mode: "insensitive" } };
    }
  }

  if (batchParam) {
    if (uuidRegex.test(batchParam)) {
      normalizedFilter.batchId = batchParam;
    } else {
      // batchParam is a batch name like "B-4" — filter via relation, case-insensitive
      normalizedFilter.batch = { name: { equals: batchParam, mode: "insensitive" } };
    }
  }

  if (genderParam && genderParam !== "All" && genderParam !== "") {
    // gender stored as "Male"/"Female" — use insensitive equals for robustness
    normalizedFilter.gender = { equals: genderParam, mode: "insensitive" };
  }

  // search may come as ?search= or ?searchTerm= — combine with filters via AND
  const searchTerm = query.searchTerm ?? query.search ?? "";

  // Robust parse: query.orderBy may already be object if query parser did nested parse
  let rawOrderBy: any = { createdAt: "desc" };
  if (query.orderBy) {
    try {
      rawOrderBy = typeof query.orderBy === "string" ? JSON.parse(query.orderBy) : query.orderBy;
    } catch (e) {
      console.warn("[studentService.getAll] failed to parse orderBy, falling back:", query.orderBy, e);
      rawOrderBy = { createdAt: "desc" };
    }
  }
  // Detect numeric stdRegNo sort: frontend normally sends [{stdRegNo:"asc"},...] when class filtered
  // Relax check to also accept plain object {stdRegNo:"asc"} and legacy ?sortBy=stdRegNo&sortOrder=asc
  const needsNumericRegNoSort = (() => {
    if (Array.isArray(rawOrderBy) && rawOrderBy.some((o: any) => o && typeof o === "object" && "stdRegNo" in o)) return true;
    if (rawOrderBy && typeof rawOrderBy === "object" && !Array.isArray(rawOrderBy) && "stdRegNo" in rawOrderBy) return true;
    if (query.sortBy === "stdRegNo" || (query as any).sortField === "stdRegNo" || (query as any).orderByField === "stdRegNo") return true;
    return false;
  })();

  const studentQuery = builderQuery({
    searchFields: ["name", "parentPhone", "address", "stdRegNo"],
    searchTerm,
    filter: normalizedFilter,
    orderBy: rawOrderBy,
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10,
  });

  console.log("[studentService.getAll] normalizedFilter:", normalizedFilter);
  console.log("[studentService.getAll] where clause:", JSON.stringify(studentQuery.where, null, 2));
  console.log("[studentService.getAll] orderBy:", JSON.stringify(rawOrderBy, null, 2), "needsNumericSort:", needsNumericRegNoSort);

  // CRITICAL: count must use SAME where as findMany — otherwise Total Students / pagination stays unfiltered (514 / 52 pages)
  const whereForCount = studentQuery.where;
  const totalStudents = await prisma.student.count({
    where: whereForCount,
  });
  const currentPage = Number(query.page) || 1;
  const totalPages = Math.ceil(totalStudents / studentQuery.take);

  let response: any[];
  // When sorting by stdRegNo (string column) we must sort numerically, not lexicographically.
  // String sort fails for varying lengths / prefixes (e.g., "9" > "10" lexicographically but 9 < 10 numerically).
  // Use DB-side CAST("stdRegNo" AS INTEGER) via raw query for stable numeric ordering, with pagination applied in DB.
  // Counter-checked: class-8 string vs numeric identical for uniform 6-digit data, but numeric cast guarantees correctness across all classes/pages.
  if (needsNumericRegNoSort) {
    // Build raw WHERE fragments from normalizedFilter + searchTerm to mirror builderQuery's where
    // Keep it explicit for class-filtered path (the only path that uses numeric stdRegNo sort)
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const offset = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClauses: any[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    // Helper to push Prisma.sql fragments safely
    const sqlConditions: Prisma.Sql[] = [];

    if (normalizedFilter.classId) {
      sqlConditions.push(Prisma.sql`s."classId" = ${normalizedFilter.classId}`);
    }
    if (normalizedFilter.batchId) {
      sqlConditions.push(Prisma.sql`s."batchId" = ${normalizedFilter.batchId}`);
    }
    // gender is stored as { equals, mode } or plain string
    const genderVal = (normalizedFilter as any).gender?.equals ?? (normalizedFilter as any).gender;
    if (genderVal) {
      sqlConditions.push(Prisma.sql`s."gender" ILIKE ${genderVal}`);
    }
    // relation filters (stdClass / batch) when classParam was a name, not uuid
    if ((normalizedFilter as any).stdClass?.className?.equals) {
      const cn = (normalizedFilter as any).stdClass.className.equals;
      sqlConditions.push(Prisma.sql`EXISTS (SELECT 1 FROM "StdClass" c WHERE c.id = s."classId" AND c."className" ILIKE ${cn})`);
    }
    if ((normalizedFilter as any).batch?.name?.equals) {
      const bn = (normalizedFilter as any).batch.name.equals;
      sqlConditions.push(Prisma.sql`EXISTS (SELECT 1 FROM "Batch" b WHERE b.id = s."batchId" AND b.name ILIKE ${bn})`);
    }
    if (searchTerm) {
      const like = `%${searchTerm}%`;
      sqlConditions.push(
        Prisma.sql`(s.name ILIKE ${like} OR s."parentPhone" ILIKE ${like} OR s.address ILIKE ${like} OR s."stdRegNo" ILIKE ${like})`,
      );
    }

    const whereSql = sqlConditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(sqlConditions, " AND ")}` : Prisma.empty;

    // Raw IDs sorted numerically — pagination applied here, so serial (offset+index+1) is stable
    // Use CAST with regex guard to avoid error on non-numeric stdRegNo (should not happen, but fallback to string)
    // TRIM handles inconsistent whitespace (e.g. " 806054 "); BIGINT avoids overflow vs INTEGER (max 2147483647)
    const sortedIds: { id: string }[] = await prisma.$queryRaw`
      SELECT s.id FROM "Student" s
      ${whereSql}
      ORDER BY
        CASE WHEN TRIM(s."stdRegNo") ~ '^[0-9]+$' THEN CAST(TRIM(s."stdRegNo") AS BIGINT) ELSE NULL END ASC NULLS LAST,
        s.name ASC,
        s."createdAt" ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
    const ids = sortedIds.map((r) => r.id);
    console.log("[studentService.getAll] sortedIds (raw numeric order):", JSON.stringify(sortedIds, null, 2));
    // Debug: also log raw stdRegNo values in that order for class-8 diagnosis (re-query to surface actual stored values)
    if (ids.length > 0) {
      const debugRegs: { id: string; stdRegNo: string | null }[] = await prisma.$queryRaw`
        SELECT s.id, s."stdRegNo" FROM "Student" s WHERE s.id IN (${Prisma.join(ids)})
      `;
      // Re-order debugRegs to sortedIds order for readability
      const regById = new Map(debugRegs.map((r: any) => [r.id, r.stdRegNo]));
      console.log("[studentService.getAll] stdRegNo in sorted order:", ids.map((id) => ({ id, stdRegNo: regById.get(id) })));
      // If counts mismatch, surface warning (race/deleted row between queries)
      if (debugRegs.length !== ids.length) {
        console.warn("[studentService.getAll] WARNING: sortedIds vs debugRegs count mismatch", { sortedIds: ids.length, debugRegs: debugRegs.length });
      }
    }
    if (ids.length === 0) {
      response = [];
    } else {
      const unsorted = await prisma.student.findMany({
        where: { id: { in: ids } },
        include: {
          stdClass: true,
          batch: true,
          weeklyMarksSheets: true,
          monthlyExamResults: true,
        },
      });
      // Re-order to match raw sorted order (Prisma IN does not preserve order)
      const byId = new Map(unsorted.map((s: any) => [s.id, s]));
      response = ids.map((id) => byId.get(id)).filter(Boolean) as any[];
      // Step 3 debug: confirm re-assembly preserved order and didn't drop rows
      console.log("[studentService.getAll] re-assembled response order:", response.map((r: any) => ({ id: r.id, stdRegNo: r.stdRegNo })));
      if (response.length !== ids.length) {
        console.warn("[studentService.getAll] WARNING: re-assembly dropped rows", { ids: ids.length, response: response.length, missing: ids.filter((id) => !byId.has(id)) });
      }
    }
  } else {
    response = await prisma.student.findMany({
      ...studentQuery,
      // ensure where is not overwritten — explicitly reuse whereForCount
      where: whereForCount,
      include: {
        stdClass: true,
        batch: true,
        weeklyMarksSheets: true,
        monthlyExamResults: true,
      },
    });
  }

  return {
    meta: {
      totalItems: totalStudents,
      totalPages,
      currentPage,
    },
    data: response,
  };
};

const getById = async (id: string) => {
  return prisma.student.findUnique({
    where: { id },
    include: {
      stdClass: true,
      batch: true,
      weeklyMarksSheets: true,
      monthlyExamResults: true,
    },
  });
};

const deleteStudent = async (id: string) => {
  await prisma.student.findUniqueOrThrow({
    where: { id },
  });

  // First delete related records to avoid foreign key constraint violation
  await prisma.weeklyMarksSheet.deleteMany({ where: { studentId: id } });
  // MonthlyExamResult has cascade to SubjectResult, so delete it directly
  await prisma.monthlyExamResult.deleteMany({ where: { studentId: id } });

  return prisma.student.delete({ where: { id } });
};

export const studentService = {
  create,
  getAll,
  getById,
  update,
  delete: deleteStudent,
  login, // ✅
  getMyResults, // ✅
};
