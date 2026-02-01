import { Router } from 'express';
import auth from '../../middlewares/authorization';
import { featureNames } from '../../constant/seedRoleData';
import validation from '../../middlewares/validation';
import { RoleValidation } from './role.validation';
import { RoleController } from './role.controller';

const router = Router();

router.post(
  '/',
  auth([featureNames.rolesAndPermissions]),
  validation(RoleValidation.createRoleValidation),
  RoleController.createRole,
);

router.get('/', RoleController.getRoles);

router.get('/:id', auth([featureNames.rolesAndPermissions]), RoleController.getRoleById);

// ...existing code...

router.patch(
  '/admin-user/:adminUserId/role/:roleId',
  auth([featureNames.rolesAndPermissions]),
  RoleController.updateAdminUserRole,
);

// ...existing code...

router.put(
  '/:id',
  auth([featureNames.rolesAndPermissions]),
  validation(RoleValidation.updateRoleValidation),
  RoleController.updateRole,
);

router.delete('/:id', auth([featureNames.rolesAndPermissions]), RoleController.deleteRole);
router.delete('/admin-user/:id', auth([featureNames.rolesAndPermissions]), RoleController.deleteAdminUser);

export const RoleRoutes = router;
