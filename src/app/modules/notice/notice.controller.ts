import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { noticeService } from './notice.service';

const createNotice = catchAsync(async (req, res) => {
  const response = await noticeService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Notice created successfully',
    data: response,
  });
});

const getAllNotices = catchAsync(async (req, res) => {
  const response = await noticeService.getAll(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notices retrieved successfully',
    data: response,
  });
});

const getPublishedNotices = catchAsync(async (req, res) => {
  const response = await noticeService.getPublishedNotices(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Published notices retrieved successfully',
    data: response,
  });
});

const getNoticeById = catchAsync(async (req, res) => {
  const response = await noticeService.getById(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notice retrieved successfully',
    data: response,
  });
});

const updateNotice = catchAsync(async (req, res) => {
  const response = await noticeService.update(req.params.id as string, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notice updated successfully',
    data: response,
  });
});

const deleteNotice = catchAsync(async (req, res) => {
  const response = await noticeService.delete(req.params.id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notice deleted successfully',
    data: response,
  });
});

export const noticeController = {
  createNotice,
  getAllNotices,
  getPublishedNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
};
