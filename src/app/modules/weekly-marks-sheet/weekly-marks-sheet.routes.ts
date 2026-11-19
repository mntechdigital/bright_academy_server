import { Router } from "express";
import auth from "../../middlewares/authorization";
import { featureNames } from "../../constant/seedRoleData";
import * as weeklyMarksSheetController from "./weekly-marks-sheet.controller";

const router = Router();

router.post("/", auth([featureNames.weeklyMarksSheets]), weeklyMarksSheetController.createWeeklyMarksSheet);
router.get("/", auth([featureNames.weeklyMarksSheets]), weeklyMarksSheetController.getAllWeeklyMarksSheets);

// �o. STATIC ROUTE ��+��-��
router.delete("/class/batch", auth([featureNames.weeklyMarksSheets]), weeklyMarksSheetController.deleteWeeklyMarksSheetsByClass);
router.post("/obtained-marks", auth([featureNames.weeklyMarksSheets]), weeklyMarksSheetController.upsertStudentObtainedMarks);
router.post("/bulk-obtained-marks", auth([featureNames.weeklyMarksSheets]), weeklyMarksSheetController.bulkUpsertStudentMarks);


// Get weekly marks by filters (class, batch, subject, week, month, year)
// This returns only the selected week's data
router.get("/filter", auth([featureNames.weeklyMarksSheets]), weeklyMarksSheetController.getWeeklyMarksSheetsByFilters);
// Merit Position API
router.get('/merit-position', auth([featureNames.weeklyMarksSheets]), weeklyMarksSheetController.WeeklyMarksController.getMeritPosition);


// �o. ����_����ݦ��� dynamic routes (specific routes before generic routes)
router.get("/student/:studentId", auth([featureNames.weeklyMarksSheets]), weeklyMarksSheetController.getWeeklyMarksSheetsByStudent);
router.get("/:id", auth([featureNames.weeklyMarksSheets]), weeklyMarksSheetController.getWeeklyMarksSheetById);
router.put("/:id", auth([featureNames.weeklyMarksSheets]), weeklyMarksSheetController.updateWeeklyMarksSheet);
router.delete("/:id", auth([featureNames.weeklyMarksSheets]), weeklyMarksSheetController.deleteWeeklyMarksSheet);

export default router;
