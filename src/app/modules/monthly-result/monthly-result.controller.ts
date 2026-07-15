import { monthlyResultService } from "./monthly-result.service";
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

export const createMonthlyResult = catchAsync(async (req, res) => {
  const result = await monthlyResultService.create(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Monthly result created successfully",
    data: result,
  });
});

export const getAllMonthlyResults = catchAsync(
  async (req: Request, res: Response) => {
    const result = await monthlyResultService.getAll(req.query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Monthly results retrieved successfully",
      data: result,
    });
  },
);

export const getSingleMonthlyResult = catchAsync(
  async (req: Request, res: Response) => {
    const result = await monthlyResultService.getById(req.params.id as string);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Monthly result retrieved successfully",
      data: result,
    });
  },
);

export const updateMonthlyResult = catchAsync(
  async (req: Request, res: Response) => {
    const result = await monthlyResultService.update(req.params.id as string, req.body);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Monthly result updated successfully",
      data: result,
    });
  },
);

export const deleteMonthlyResult = catchAsync(
  async (req: Request, res: Response) => {
    const result = await monthlyResultService.delete(req.params.id as string);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Monthly result deleted successfully",
      data: result,
    });
  },
);

export const calculatePositions = catchAsync(
  async (req: Request, res: Response) => {
    const { classId, month } = req.body;

    const result = await monthlyResultService.calculatePositionsByClass(
      classId,
      month,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Positions calculated successfully',
      data: result,
    });
  },
);
