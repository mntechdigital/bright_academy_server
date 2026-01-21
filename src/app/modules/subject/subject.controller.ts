import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { subjectService } from './subject.service';

const createSubject = catchAsync(async (req, res) => {
	const response = await subjectService.create(req.body);
	sendResponse(res, {
		statusCode: 201,
		success: true,
		message: 'Subject created successfully',
		data: response,
	});
});

const getAllSubjects = catchAsync(async (req, res) => {
	const response = await subjectService.getAll(req.query);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Subjects retrieved successfully',
		data: response,
	});
});

const getSubjectById = catchAsync(async (req, res) => {
	const response = await subjectService.getById(req.params.id as string);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Subject retrieved successfully',
		data: response,
	});
});

const updateSubject = catchAsync(async (req, res) => {
	const response = await subjectService.update(req.params.id as string, req.body);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Subject updated successfully',
		data: response,
	});
});

const deleteSubject = catchAsync(async (req, res) => {
	const response = await subjectService.delete(req.params.id as string);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Subject deleted successfully',
		data: response,
	});
});

export const subjectController = {
	createSubject,
	getAllSubjects,
	getSubjectById,
	updateSubject,
	deleteSubject,
};
