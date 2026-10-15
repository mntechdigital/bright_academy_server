-- CreateTable
CREATE TABLE "ExamRoutine" (
    "id" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "month" TEXT,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamRoutine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineWeek" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "weekNo" INTEGER NOT NULL,
    "weekLabel" TEXT NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "durationHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutineWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineSubject" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "fullMarks" INTEGER NOT NULL,
    "subjectId" TEXT NOT NULL,
    "alternatives" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutineSubject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExamRoutine_examName_year_classId_key" ON "ExamRoutine"("examName", "year", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineWeek_routineId_weekNo_key" ON "RoutineWeek"("routineId", "weekNo");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineSubject_weekId_subjectId_key" ON "RoutineSubject"("weekId", "subjectId");

-- AddForeignKey
ALTER TABLE "ExamRoutine" ADD CONSTRAINT "ExamRoutine_classId_fkey" FOREIGN KEY ("classId") REFERENCES "StdClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineWeek" ADD CONSTRAINT "RoutineWeek_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "ExamRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineSubject" ADD CONSTRAINT "RoutineSubject_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "RoutineWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineSubject" ADD CONSTRAINT "RoutineSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
