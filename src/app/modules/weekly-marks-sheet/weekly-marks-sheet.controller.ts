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


// delete all weekly marks sheets
export const deleteWeeklyMarksSheetsBySectionAndClass = catchAsync(async (req: Request, res: Response) => {
  const { sectionId, stdClassId } = req.body;
  const result = await weeklyMarksSheetService.deleteWeeklyMarksSheetsBySectionAndClass({
    sectionId: sectionId as string,
    stdClassId: stdClassId as string,
  });
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All Weekly Marks Sheets deleted successfully",
    data: result,
  });
});


export const upsertStudentObtainedMarks = catchAsync(async (req: Request, res: Response) => {
  const result = await weeklyMarksSheetService.upsertStudentObtainedMarks(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Obtained marks saved/updated successfully",
    data: result,
  });
});
