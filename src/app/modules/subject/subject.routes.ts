import { Router } from 'express';
import validation from '../../middlewares/validation';
import { SubjectValidation } from './subject.validation';
import { subjectController } from './subject.controller';

const router = Router();

router.post(
  '/',
  validation(SubjectValidation.createSubjectSchema),
  subjectController.createSubject,
);

router.get('/', subjectController.getAllSubjects);

router.get('/:id', subjectController.getSubjectById);

router.put(
  '/:id',
  validation(SubjectValidation.updateSubjectSchema),
  subjectController.updateSubject,
);

router.delete(
  '/:id',
  subjectController.deleteSubject,
);

export const SubjectRoutes = router;
