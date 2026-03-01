import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { teacherService } from './teacher.service';

const getAllTeachers = catchAsync(async (req, res) => {
  const response = await teacherService.getAll(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Teachers retrieved successfully',
    meta: response.meta,
    data: response.data,
  });
});

const getTeacherById = catchAsync(async (req, res) => {
  const response = await teacherService.getById(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Teacher retrieved successfully',
    data: response,
  });
});

const updateTeacher = catchAsync(async (req, res) => {
  const response = await teacherService.update(req.params.id as string, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Teacher updated successfully',
    data: response,
  });
});

const deleteTeacher = catchAsync(async (req, res) => {
  const response = await teacherService.delete(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Teacher deleted successfully',
    data: response,
  });
});

export const teacherController = {
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
};
