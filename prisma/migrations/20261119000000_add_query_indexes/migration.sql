-- CreateIndex
CREATE INDEX "Student_classId_idx" ON "Student"("classId");

-- CreateIndex
CREATE INDEX "Student_batchId_idx" ON "Student"("batchId");

-- CreateIndex
CREATE INDEX "MonthlyExamResult_studentId_idx" ON "MonthlyExamResult"("studentId");

-- CreateIndex
CREATE INDEX "MonthlyExamResult_studentId_month_idx" ON "MonthlyExamResult"("studentId", "month");

-- CreateIndex
CREATE INDEX "MonthlyExamResult_classId_idx" ON "MonthlyExamResult"("classId");

-- CreateIndex
CREATE INDEX "SubjectResult_examResultId_idx" ON "SubjectResult"("examResultId");

-- CreateIndex
CREATE INDEX "WeeklyMarksSheet_studentId_idx" ON "WeeklyMarksSheet"("studentId");

-- CreateIndex
CREATE INDEX "WeeklyMarksSheet_stdClassId_month_year_idx" ON "WeeklyMarksSheet"("stdClassId", "month", "year");

-- CreateIndex
CREATE INDEX "RoutineSubject_subjectId_idx" ON "RoutineSubject"("subjectId");
