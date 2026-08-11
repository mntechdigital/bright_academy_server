
import { Router } from 'express';
import auth from '../../middlewares/authorization';
import { featureNames } from '../../constant/seedRoleData';
import validation from '../../middlewares/validation';
import { StudentValidation } from './student.validation';
import { studentController } from './student.controller';
import studentAuth from '../../middlewares/studentAuthorization';

const router = Router();

router.post(
  '/',
  auth([featureNames.students]),
  validation(StudentValidation.createStudentSchema),
  studentController.createStudent,
);

router.get('/', studentController.getAllStudents);

// Public route — login
router.post(
  '/login',
  validation(StudentValidation.loginSchema),
  studentController.loginStudent,
);

// Protected route — show own results
router.get('/my-results', studentAuth(), studentController.getMyResults);

// ✅ ADD THIS ROUTE
router.get(
  '/merit-position',
  studentAuth(),
  studentController.getMeritPosition,
);

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

// Dynamic route always at bottom
router.get('/:id', studentController.getStudentById);

export const StudentRoutes = router;

