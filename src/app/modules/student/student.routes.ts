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

// Public route — login (specific path, must stay above any '/:id' route)
router.post(
  '/login',
  validation(StudentValidation.loginSchema),
  studentController.loginStudent,
);

// Protected route — show own results
// ✅ studentAuth() কল করা হয়েছে (factory function ছিল)
// ✅ '/:id' রুটের আগে রাখা হয়েছে, নাহলে Express এটাকে id="my-results" ধরে নিত
router.get('/my-results', studentAuth(), studentController.getMyResults);

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

// ⚠️ Dynamic param route গুলো (':id') সবসময় সবার নিচে রাখুন,
// নাহলে এগুলো '/login', '/my-results' এর মতো specific path গুলোকে আগেই ম্যাচ করে নিবে
router.get('/:id', studentController.getStudentById);

export const StudentRoutes = router;