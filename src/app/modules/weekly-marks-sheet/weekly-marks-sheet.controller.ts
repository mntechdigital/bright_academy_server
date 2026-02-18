import { Request, Response } from "express";
import * as weeklyMarksSheetService from "./weekly-marks-sheet.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

export const createWeeklyMarksSheet = catchAsync(async (req: Request, res: Response) => {
  const result = await weeklyMarksSheetService.createWeeklyMarksSheet(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Weekly Marks Sheet created successfully",
    data: result,
  });
});

// Add more controller methods as needed
