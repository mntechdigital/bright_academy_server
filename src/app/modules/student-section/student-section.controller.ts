import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { studentSectionService } from './student-section.service';

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

export const studentSectionController = {
	getAllStudentSections,
	getStudentSectionById,
};
