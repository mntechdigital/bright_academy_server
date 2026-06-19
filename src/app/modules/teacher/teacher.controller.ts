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

// ----------------------------
// নতুন: Teacher Login
// ----------------------------
const login = catchAsync(async (req, res) => {
  const response = await teacherService.login(req.body);

  res.cookie('refreshToken', response.refreshToken, {
    httpOnly: true,
    sameSite: true,
    maxAge: 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Login Successful',
    data: response,
  });
});

// ----------------------------
// নতুন: Refresh Token
// ----------------------------
const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await teacherService.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Access token refreshed successfully',
    data: result,
  });
});

// ----------------------------
// নতুন: লগইন করা Teacher এর নিজের তথ্য
// ----------------------------
const getMe = catchAsync(async (req, res) => {
  const response = await teacherService.getMe(req.user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Teacher details fetched successfully',
    data: response,
  });
});

export const teacherController = {
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  login,
  refreshToken,
  getMe,
};