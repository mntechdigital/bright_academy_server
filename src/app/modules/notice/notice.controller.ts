import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { noticeService } from './notice.service';
import { deleteNoticePdf, uploadPdfToCloudinary } from '../../utils/cloudinary';
import AppError from '../../errors/AppError';

const createNotice = catchAsync(async (req, res) => {
  const { title, isPublished } = req.body;

  const pdfUrl = await uploadPdfToCloudinary(req.file);

  const response = await noticeService.create({
    title,
    pdfUrl,
    isPublished: isPublished !== undefined ? isPublished === 'true' || isPublished === true : true,
  });

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

const getNoticePdf = catchAsync(async (req, res) => {
  const notice = await noticeService.getById(req.params.id as string);

  if (!notice.pdfUrl) {
    throw new AppError(404, 'No PDF attached to this notice');
  }

  // The PDF lives on Cloudinary; redirect the client to its secure URL.
  res.redirect(notice.pdfUrl);
});

const updateNotice = catchAsync(async (req, res) => {
  const { title, isPublished } = req.body;
  const id = req.params.id as string;

  const updateData: Record<string, any> = {};

  if (title !== undefined) updateData.title = title;
  if (isPublished !== undefined) {
    updateData.isPublished = isPublished === 'true' || isPublished === true;
  }

  if (req.file) {
    const existingNotice = await noticeService.getById(id);
    if (existingNotice.pdfUrl) {
      await deleteNoticePdf(existingNotice.pdfUrl);
    }
    updateData.pdfUrl = await uploadPdfToCloudinary(req.file);
  }

  const response = await noticeService.update(id, updateData);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Notice updated successfully',
    data: response,
  });
});

const deleteNotice = catchAsync(async (req, res) => {
  const existingNotice = await noticeService.getById(req.params.id as string);
  if (existingNotice.pdfUrl) {
    await deleteNoticePdf(existingNotice.pdfUrl);
  }

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
  getNoticePdf,
  updateNotice,
  deleteNotice,
};
