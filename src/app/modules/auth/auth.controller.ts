import catchAsync from '../../utils/catchAsync';
import { getSingleImageUrl } from '../../utils/getImageUrl';
import sendResponse from '../../utils/sendResponse';
import { AuthServices } from './auth.service';

const login = catchAsync(async (req, res) => {
  const response = await AuthServices.loginIntoDB(req.body);

  res.cookie('refreshToken', response.refreshToken, {
    httpOnly: true,
    sameSite: true,
    maxAge: 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Login Successful',
    data: response,
  });
});

const register = catchAsync(async (req, res) => {
  const profilePhotoUrl = req.file
    ? getSingleImageUrl(req, req.file)
    : undefined;

  if (profilePhotoUrl) {
    req.body.profilePhoto = profilePhotoUrl;
  }
  const response = await AuthServices.registerIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Registration Successful',
    data: response,
  });
});

const forgetPassword = catchAsync(async (req, res) => {
  const result = await AuthServices.forgetPasswordIntoDB(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Reset link sent to your email',
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { id, password, token } = req.body;
  const result = await AuthServices.resetPasswordIntoDB(id, password, token);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const response = await AuthServices.changePasswordIntoDB(
    req.user,
    req.body.newPassword,
    req.body.currentPassword,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password changed successfully',
    data: response,
  });
});

const refreshAccessToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  const result = await AuthServices.refreshAccessTokenIntoDB(refreshToken);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Access token refreshed successfully',
    data: result,
  });
});

const getLoggedAdminDetails = catchAsync(async (req, res) => {
  const response = await AuthServices.getLoggedAdminDetailsFromDB(req.user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User details fetched successfully',
    data: response,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const profilePhotoUrl = req.file
    ? getSingleImageUrl(req, req.file)
    : undefined;

  if (profilePhotoUrl) {
    req.body.profilePhoto = profilePhotoUrl;
  }

  const response = await AuthServices.updateAdminProfileIntoDB(
    req.user,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile updated successfully',
    data: response,
  });
});

const getAdminUsers = catchAsync(async (req, res) => {
  const response = await AuthServices.getAdminUsersFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin users fetched successfully',
    meta: response.meta,
    data: response.data,
  });
});

const changeAdminUserStatus = catchAsync(async (req, res) => {
  const response = await AuthServices.changeAdminUserStatusIntoDB(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin user status changed successfully',
    data: response,
  });
});

const deleteAdminUser = catchAsync(async (req, res) => {
  const response = await AuthServices.deleteAdminUserFromDB(
    req.user,
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin user deleted successfully',
    data: response,
  });
});

export const AuthController = {
  login,
  register,
  forgetPassword,
  resetPassword,
  changePassword,
  refreshAccessToken,
  getLoggedAdminDetails,
  updateProfile,
  getAdminUsers,
  changeAdminUserStatus,
  deleteAdminUser,
};
