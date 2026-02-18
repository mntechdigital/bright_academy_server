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

export const getAllWeeklyMarksSheets = catchAsync(async (req: Request, res: Response) => {
  const result = await weeklyMarksSheetService.getAllWeeklyMarksSheets(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Weekly Marks Sheets fetched successfully",
    data: result,
  });
});

export const getWeeklyMarksSheetById = catchAsync(async (req: Request, res: Response) => {
  const result = await weeklyMarksSheetService.getWeeklyMarksSheetById(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Weekly Marks Sheet fetched successfully",
    data: result,
  });
});

export const updateWeeklyMarksSheet = catchAsync(async (req: Request, res: Response) => {
  const result = await weeklyMarksSheetService.updateWeeklyMarksSheet(req.params.id as string, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Weekly Marks Sheet updated successfully",
    data: result,
  });
});

export const deleteWeeklyMarksSheet = catchAsync(async (req: Request, res: Response) => {
  const result = await weeklyMarksSheetService.deleteWeeklyMarksSheet(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Weekly Marks Sheet deleted successfully",
    data: result,
  });
});
