import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { studentService } from './student.service';

const createStudent = catchAsync(async (req, res) => {
	const response = await studentService.create(req.body);
	sendResponse(res, {
		statusCode: 201,
		success: true,
		message: 'Student created successfully',
		data: response,
	});
});

const getAllStudents = catchAsync(async (req, res) => {
	const response = await studentService.getAll(req.query);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Students retrieved successfully',
		data: response,
	});
});

const getStudentById = catchAsync(async (req, res) => {
	const response = await studentService.getById(req.params.id as string);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Student retrieved successfully',
		data: response,
	});
});

const updateStudent = catchAsync(async (req, res) => {
	const response = await studentService.update(req.params.id as string, req.body);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Student updated successfully',
		data: response,
	});
});

const deleteStudent = catchAsync(async (req, res) => {
	const response = await studentService.delete(req.params.id as string);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Student deleted successfully',
		data: response,
	});
});

const loginStudent = catchAsync(async (req, res) => {
  const response = await studentService.login(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Login সফল হয়েছে',
    data: response,
  });
});


const getMyResults = catchAsync(async (req, res) => {
  const studentId = (req as any).user.studentId; // middleware থেকে
  const response = await studentService.getMyResults(studentId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Result retrieved successfully',
    data: response,
  });
});



import { Request, Response } from 'express';
import * as weeklyMarksSheetService from '../weekly-marks-sheet/weekly-marks-sheet.service';

// Merit Position Controller
const getMeritPosition = async (req: Request, res: Response) => {
  console.log('🔥 MERIT CONTROLLER HIT 🔥');

  try {
    const { classId, week, month, year, studentId } = req.query;

    const result =
      await weeklyMarksSheetService.WeeklyMarksService.getMeritPosition({
        classId: classId as string,
        week: week as string,
        month: month as string,
        year: year as string,
        studentId: studentId as string,
      });

    console.log('🔥 MERIT RESULT:', result);

    res.status(200).json({
      success: true,
      message: 'Merit position retrieved successfully',
      data: result,
    });
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const studentController = {
	createStudent,
	getAllStudents,
	getStudentById,
	updateStudent,
	deleteStudent,
	loginStudent, // ✅
	getMyResults, // ✅
	
  getMeritPosition,
};
