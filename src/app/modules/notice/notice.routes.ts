import { Router } from 'express';
import validation from '../../middlewares/validation';
import { NoticeValidation } from './notice.validation';
import { noticeController } from './notice.controller';

const router = Router();

router.post(
  '/',
  validation(NoticeValidation.createNoticeSchema),
  noticeController.createNotice,
);

router.get('/', noticeController.getAllNotices);

router.get('/published', noticeController.getPublishedNotices);

router.get('/:id', noticeController.getNoticeById);

router.patch(
  '/:id',
  validation(NoticeValidation.updateNoticeSchema),
  noticeController.updateNotice,
);

router.delete(
  '/:id',
  noticeController.deleteNotice,
);

export const NoticeRoutes = router;
