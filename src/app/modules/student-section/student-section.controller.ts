import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { studentSectionService } from './student-section.service';

const createStudentSection = catchAsync(async (req, res) => {
	const response = await studentSectionService.create(req.body);
	sendResponse(res, {
		statusCode: 201,
		success: true,
		message: 'Student section created successfully',
		data: response,
	});
});

const getAllStudentSections = catchAsync(async (req, res) => {
	const response = await studentSectionService.getAll(req.query);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Student sections retrieved successfully',
		data: response,
	});
});

const getStudentSectionById = catchAsync(async (req, res) => {
	const response = await studentSectionService.getById(req.params.id as string);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Student section retrieved successfully',
		data: response,
	});
});

const updateStudentSection = catchAsync(async (req, res) => {
	const response = await studentSectionService.update(req.params.id as string, req.body);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Student section updated successfully',
		data: response,
	});
});

const deleteStudentSection = catchAsync(async (req, res) => {
	const response = await studentSectionService.delete(req.params.id as string);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Student section deleted successfully',
		data: response,
	});
});

export const studentSectionController = {
	createStudentSection,
	getAllStudentSections,
	getStudentSectionById,
	updateStudentSection,
	deleteStudentSection,
};
