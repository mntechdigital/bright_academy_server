import { Router } from 'express';
import auth from '../../middlewares/authorization';
import { featureNames } from '../../constant/seedRoleData';
import validation from '../../middlewares/validation';
import { StudentSectionValidation } from './student-section.validation';
import { studentSectionController } from './student-section.controller';

const router = Router();

router.post(
  '/',
  auth([featureNames.sections]),
  validation(StudentSectionValidation.createSectionSchema),
  studentSectionController.createStudentSection,
);

router.get('/', studentSectionController.getAllStudentSections);

router.get('/:id', studentSectionController.getStudentSectionById);

router.put(
  '/:id',
  auth([featureNames.sections]),
  validation(StudentSectionValidation.updateSectionSchema),
  studentSectionController.updateStudentSection,
);

router.delete(
  '/:id',
  auth([featureNames.sections]),
  studentSectionController.deleteStudentSection,
);

export const StudentSectionRoutes = router;
