import { Router } from 'express';
import auth from '../../middlewares/authorization';
import { featureNames } from '../../constant/seedRoleData';
import validation from '../../middlewares/validation';
import { StudentClassValidation } from './student-class.validation';
import { studentClassController } from './student-class.controller';
const router = Router();

router.post(
  '/',
  auth([featureNames.studentClasses]),
  validation(StudentClassValidation.createStudentClassValidation),
  studentClassController.createStudentClass,
);

router.get('/', studentClassController.getAllStudentClasses);


router.get('/:id', studentClassController.getStudentClassById);

router.put(
  '/:id',
  auth([featureNames.studentClasses]),
  validation(StudentClassValidation.updateStudentClassValidation),
  studentClassController.updateStudentClass,
);

router.delete(
  '/:id',
  auth([featureNames.studentClasses]),
  studentClassController.deleteStudentClass,
);

router.delete(
  '/:id',
  auth([featureNames.studentClasses]),
  studentClassController.deleteStudentClass,
);

export const StudentClassRoutes = router;
