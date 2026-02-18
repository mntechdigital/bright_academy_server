import { Router } from "express";
import * as weeklyMarksSheetController from "./weekly-marks-sheet.controller";

const router = Router();

router.post("/", weeklyMarksSheetController.createWeeklyMarksSheet);

// Add more routes as needed

export default router;
