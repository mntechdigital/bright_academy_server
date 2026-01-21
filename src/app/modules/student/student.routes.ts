import { Router } from 'express';
import auth from '../../middlewares/authorization';
import { featureNames } from '../../constant/seedRoleData';
import validation from '../../middlewares/validation';
import { StudentValidation } from './student.validation';
import { studentController } from './student.controller';

const router = Router();

router.post(
  '/',
  auth([featureNames.students]),
  validation(StudentValidation.createStudentSchema),
  studentController.createStudent,
);

router.get('/', studentController.getAllStudents);

router.get('/:id', studentController.getStudentById);

router.put(
  '/:id',
  auth([featureNames.students]),
  validation(StudentValidation.updateStudentSchema),
  studentController.updateStudent,
);

router.delete(
  '/:id',
  auth([featureNames.students]),
  studentController.deleteStudent,
);

export const StudentRoutes = router;
