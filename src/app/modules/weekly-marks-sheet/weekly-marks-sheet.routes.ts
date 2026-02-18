import { Router } from "express";
import * as weeklyMarksSheetController from "./weekly-marks-sheet.controller";

const router = Router();

router.post("/", weeklyMarksSheetController.createWeeklyMarksSheet);
router.get("/", weeklyMarksSheetController.getAllWeeklyMarksSheets);
router.get("/:id", weeklyMarksSheetController.getWeeklyMarksSheetById);
router.patch("/:id", weeklyMarksSheetController.updateWeeklyMarksSheet);
router.delete("/:id", weeklyMarksSheetController.deleteWeeklyMarksSheet);

export default router;
