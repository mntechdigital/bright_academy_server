
import catchAsync from '../utils/catchAsync';
import sendResponse from '../utils/sendResponse';
import { batchService } from './batch.service';

const createBatch = catchAsync(async (req, res) => {
	const response = await batchService.create(req.body);
	sendResponse(res, {
		statusCode: 201,
		success: true,
		message: 'Batch created successfully',
		data: response,
	});
});

const getAllBatches = catchAsync(async (req, res) => {
	const response = await batchService.getAll(req.query);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Batches retrieved successfully',
		data: response,
	});
});

const getBatchById = catchAsync(async (req, res) => {
	const response = await batchService.getById(req.params.id as string);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Batch retrieved successfully',
		data: response,
	});
});

const getBatchesByClassId = catchAsync(async (req, res) => {
	const response = await batchService.getByClassId(req.params.classId as string);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Batches retrieved successfully',
		data: response,
	});
});

const updateBatch = catchAsync(async (req, res) => {
	const response = await batchService.update(req.params.id as string, req.body);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Batch updated successfully',
		data: response,
	});
});

const deleteBatch = catchAsync(async (req, res) => {
	const response = await batchService.delete(req.params.id as string);
	sendResponse(res, {
		statusCode: 200,
		success: true,
		message: 'Batch deleted successfully',
		data: response,
	});
});

export const batchController = {
	createBatch,
	getAllBatches,
	getBatchById,
	getBatchesByClassId,
	updateBatch,
	deleteBatch,
};