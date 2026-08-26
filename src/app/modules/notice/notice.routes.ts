import { Router } from 'express';
import { pdfUpload } from '../../middlewares/multer';
import { noticeController } from './notice.controller';

const router = Router();

router.post(
  '/',
  pdfUpload.single('pdf'),
  noticeController.createNotice,
);

router.get('/', noticeController.getAllNotices);

router.get('/published', noticeController.getPublishedNotices);

router.get('/:id/pdf', noticeController.getNoticePdf);

router.get('/:id', noticeController.getNoticeById);

router.patch(
  '/:id',
  pdfUpload.single('pdf'),
  noticeController.updateNotice,
);

router.delete(
  '/:id',
  noticeController.deleteNotice,
);

export const NoticeRoutes = router;
