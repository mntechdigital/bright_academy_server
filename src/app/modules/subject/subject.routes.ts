import { Router } from 'express';
import auth from '../../middlewares/authorization';
import { featureNames } from '../../constant/seedRoleData';
import validation from '../../middlewares/validation';
import { SubjectValidation } from './subject.validation';
import { subjectController } from './subject.controller';

const router = Router();

router.post(
  '/',
  auth([featureNames.subjects]),
  validation(SubjectValidation.createSubjectSchema),
  subjectController.createSubject,
);

router.get('/', subjectController.getAllSubjects);

router.get('/:id', subjectController.getSubjectById);

router.put(
  '/:id',
  auth([featureNames.subjects]),
  validation(SubjectValidation.updateSubjectSchema),
  subjectController.updateSubject,
);

router.delete(
  '/:id',
  auth([featureNames.subjects]),
  subjectController.deleteSubject,
);

export const SubjectRoutes = router;
