import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as resultService from './result.service';

export const getWeeklyResults = catchAsync(async (req: Request, res: Response) => {
  const result = await resultService.getWeeklyResults(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Weekly results retrieved successfully',
    data: result,
  });
});
