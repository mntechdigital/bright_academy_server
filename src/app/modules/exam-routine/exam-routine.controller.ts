import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../errors/AppError';
import { examRoutineService } from './exam-routine.service';
import { ExamRoutineValidation } from './exam-routine.validation';

const dropEmpty = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const getAllExamRoutines = catchAsync(async (req, res) => {
  const parsed = ExamRoutineValidation.examRoutineQuerySchema.safeParse({
    year: dropEmpty(req.query.year),
    classId: dropEmpty(req.query.classId),
    stream: dropEmpty(req.query.stream),
  });

  if (!parsed.success) {
    throw new AppError(400, 'Invalid query parameters');
  }

  const response = await examRoutineService.getAll(parsed.data);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exam routines retrieved successfully',
    data: response,
  });
});

const getExamRoutineById = catchAsync(async (req, res) => {
  const parsed =
    ExamRoutineValidation.examRoutineByIdQuerySchema.safeParse({
      stream: dropEmpty(req.query.stream),
    });

  if (!parsed.success) {
    throw new AppError(400, 'Invalid query parameters');
  }

  const response = await examRoutineService.getById(
    req.params.id as string,
    parsed.data.stream,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exam routine retrieved successfully',
    data: response,
  });
});

const createExamRoutine = catchAsync(async (req, res) => {
  const response = await examRoutineService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Exam routine created successfully',
    data: response,
  });
});

const updateExamRoutine = catchAsync(async (req, res) => {
  const response = await examRoutineService.update(
    req.params.id as string,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exam routine updated successfully',
    data: response,
  });
});

const deleteExamRoutine = catchAsync(async (req, res) => {
  const response = await examRoutineService.delete(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exam routine deleted successfully',
    data: response,
  });
});

const duplicateExamRoutine = catchAsync(async (req, res) => {
  const response = await examRoutineService.duplicate(
    req.params.id as string,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Exam routine duplication completed',
    data: response,
  });
});

export const examRoutineController = {
  getAllExamRoutines,
  getExamRoutineById,
  createExamRoutine,
  updateExamRoutine,
  deleteExamRoutine,
  duplicateExamRoutine,
};
