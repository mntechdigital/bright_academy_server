import { Router } from 'express';
import { featureNames } from '../../constant/seedRoleData';
import auth from '../../middlewares/authorization';
import { imageUpload, uploadImages } from '../../middlewares/multer';
import validation from '../../middlewares/validation';
import { AuthController } from './auth.controller';
import { authValidations } from './auth.validation';

const router = Router();

router.post(
  '/login',
  validation(authValidations.loginValidation),
  AuthController.login,
);

router.post(
  '/register',
  auth([featureNames.auth]),
  validation(authValidations.registerValidation),
  AuthController.register,
);

router.post('/forget-password', AuthController.forgetPassword);

router.post('/reset-password', AuthController.resetPassword);

router.post(
  '/change-password',
  auth([featureNames.auth]),
  validation(authValidations.changePasswordValidation),
  AuthController.changePassword,
);

router.post('/refresh-token', AuthController.refreshAccessToken);

router.get(
  '/admin-users',
  // auth([featureNames.profile]),
  AuthController.getAdminUsers,
);

router.get('/me', auth([]), AuthController.getLoggedAdminDetails);

router.put(
  '/update-profile',
  auth([featureNames.auth]),
  AuthController.updateProfile,
);

router.put(
  '/admin-users/:id/status',
  auth([featureNames.auth]),
  AuthController.changeAdminUserStatus,
);

router.delete(
  '/admin-users/:id',
  auth([featureNames.auth]),
  AuthController.deleteAdminUser,
);

export const AuthRoutes = router;
