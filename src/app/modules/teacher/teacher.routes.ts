import { Router } from 'express';
import auth from '../../middlewares/authorization';
import { featureNames } from '../../constant/seedRoleData';
import validation from '../../middlewares/validation';
import { teacherController } from './teacher.controller';
import { TeacherValidation } from './teacher.validation';
import authTeacher from '../../middlewares/authTeacher';

const router = Router();

// ----------------------------
// নতুন: Teacher Auth routes
// ----------------------------
router.post(
  '/login',
  validation(TeacherValidation.loginSchema),
  teacherController.login,
);

router.post('/refresh-token', teacherController.refreshToken);

router.get('/me', authTeacher(), teacherController.getMe);

// ----------------------------
// Existing: Admin দ্বারা Teacher management
// ----------------------------
router.get('/', teacherController.getAllTeachers);

router.get('/:id', teacherController.getTeacherById);

router.put(
  '/:id',
  auth([featureNames.teachers]),
  validation(TeacherValidation.updateTeacherSchema),
  teacherController.updateTeacher,
);

router.delete(
  '/:id',
  auth([featureNames.teachers]),
  teacherController.deleteTeacher,
);

export const TeacherRoutes = router;