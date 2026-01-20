import catchAsync from '../../utils/catchAsync';
import { getSingleImageUrl } from '../../utils/getImageUrl';
import sendResponse from '../../utils/sendResponse';
import { studentClassService } from './student-class.service';

const createFivePillar = catchAsync(async (req, res) => {
	const response = await studentClassService.create(req.body);
	sendResponse(res, {
		statusCode: 201,
		success: true,
		message: 'Five Pillar created successfully',
		data: response,
	});
});

const getAllFivePillars = catchAsync(async (req, res) => {
	const response = await studentClassService.getAll(req.query);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Five Pillars retrieved successfully',
		data: response,
	});
});


const getFivePillarById = catchAsync(async (req, res) => {
	const response = await studentClassService.getById(Number(req.params.id));
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Five Pillar retrieved successfully',
		data: response,
	});
});


const updateFivePillar = catchAsync(async (req, res) => {
	const response = await studentClassService.update(Number(req.params.id), req.body);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Five Pillar updated successfully',
		data: response,
	});
});


const deleteFivePillar = catchAsync(async (req, res) => {
	const response = await studentClassService.delete(Number(req.params.id));
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Five Pillar deleted successfully',
		data: response,
	});
});



export const studentClassController = {
	createFivePillar,
	getAllFivePillars,
	getFivePillarById,
	updateFivePillar,
	deleteFivePillar,
};
