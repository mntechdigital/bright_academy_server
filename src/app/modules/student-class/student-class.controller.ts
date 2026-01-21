import catchAsync from '../../utils/catchAsync';
import { getSingleImageUrl } from '../../utils/getImageUrl';
import sendResponse from '../../utils/sendResponse';
import { studentClassService } from './student-class.service';

const createStudentClass = catchAsync(async (req, res) => {
	const response = await studentClassService.create(req.body);
	sendResponse(res, {
		statusCode: 201,
		success: true,
		message: 'Student class created successfully',
		data: response,
	});
});

const getAllStudentClasses = catchAsync(async (req, res) => {
	const response = await studentClassService.getAll(req.query);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Student classes retrieved successfully',
		data: response,
	});
});


const getStudentClassById = catchAsync(async (req, res) => {
	const response = await studentClassService.getById(Number(req.params.id));
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Student class retrieved successfully',
		data: response,
	});
});


const updateStudentClass = catchAsync(async (req, res) => {
	const response = await studentClassService.update(Number(req.params.id), req.body);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Student class updated successfully',
		data: response,
	});
});


const deleteStudentClass = catchAsync(async (req, res) => {
	const response = await studentClassService.delete(Number(req.params.id));
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Student class deleted successfully',
		data: response,
	});
});



export const studentClassController = {
	createStudentClass,
	getAllStudentClasses,
	getStudentClassById,
	updateStudentClass,
	deleteStudentClass,
};
