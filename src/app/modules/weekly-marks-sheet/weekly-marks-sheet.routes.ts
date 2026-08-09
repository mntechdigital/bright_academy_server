import { Router } from "express";
import * as weeklyMarksSheetController from "./weekly-marks-sheet.controller";

const router = Router();

router.post("/", weeklyMarksSheetController.createWeeklyMarksSheet);
router.get("/", weeklyMarksSheetController.getAllWeeklyMarksSheets);

// ✅ STATIC ROUTE আগে
router.delete("/class/batch", weeklyMarksSheetController.deleteWeeklyMarksSheetsByClass);
router.post("/obtained-marks", weeklyMarksSheetController.upsertStudentObtainedMarks);
router.post("/bulk-obtained-marks", weeklyMarksSheetController.bulkUpsertStudentMarks);

// Get weekly marks by filters (class, batch, subject, week, month, year)
// This returns only the selected week's data
router.get("/filter", weeklyMarksSheetController.getWeeklyMarksSheetsByFilters);

// ✅ তারপর dynamic routes (specific routes before generic routes)
router.get("/student/:studentId", weeklyMarksSheetController.getWeeklyMarksSheetsByStudent);
router.get("/:id", weeklyMarksSheetController.getWeeklyMarksSheetById);
router.put("/:id", weeklyMarksSheetController.updateWeeklyMarksSheet);
router.delete("/:id", weeklyMarksSheetController.deleteWeeklyMarksSheet);

export default router;
