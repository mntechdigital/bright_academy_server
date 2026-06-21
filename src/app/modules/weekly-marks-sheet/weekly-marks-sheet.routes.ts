import { Router } from "express";
import * as weeklyMarksSheetController from "./weekly-marks-sheet.controller";

const router = Router();

router.post("/", weeklyMarksSheetController.createWeeklyMarksSheet);
router.get("/", weeklyMarksSheetController.getAllWeeklyMarksSheets);

// ✅ STATIC ROUTE আগে
router.delete("/class", weeklyMarksSheetController.deleteWeeklyMarksSheetsByClass);
router.post("/obtained-marks", weeklyMarksSheetController.upsertStudentObtainedMarks);

// ✅ তারপর dynamic routes
router.get("/:id", weeklyMarksSheetController.getWeeklyMarksSheetById);
router.put("/:id", weeklyMarksSheetController.updateWeeklyMarksSheet);
router.delete("/:id", weeklyMarksSheetController.deleteWeeklyMarksSheet);

export default router;
