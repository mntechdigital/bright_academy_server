import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { RoleService } from './role.service';

const createRole = catchAsync(async (req, res) => {
  const response = await RoleService.createRoleIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Role created successfully',
    data: response,
  });
});

const getRoles = catchAsync(async (req, res) => {
  const response = await RoleService.getRolesFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Roles retrieved successfully',
    meta: response.meta,
    data: response.data,
  });
});

const getRoleById = catchAsync(async (req, res) => {
  const response = await RoleService.getRoleByIdFromDB(req.params.id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Role retrieved successfully',
    data: response,
  });
});

const updateRole = catchAsync(async (req, res) => {
  const response = await RoleService.updateRoleIntoDB(req.params.id as string, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Role updated successfully',
    data: response,
  });
});

const deleteRole = catchAsync(async (req, res) => {
  const response = await RoleService.deleteRoleFromDB(req.params.id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Role deleted successfully',
    data: response,
  });
});


const deleteAdminUser = catchAsync(async (req, res) => {
  const response = await RoleService.deleteAdminUserFromDB(req.params.id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin User deleted successfully',
    data: response,
  });
});

const updateAdminUserRole = catchAsync(async (req, res) => {
  const { adminUserId, newRoleId } = req.body;
  const response = await RoleService.updateAdminUserRole(adminUserId, newRoleId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin User role updated successfully',
    data: response,
  });
});

export const RoleController = {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  deleteAdminUser,
  updateAdminUserRole,
};
