import prisma from '../../db/db.config';
import configs from '../configs';
import AppError from '../errors/AppError';
import catchAsync from '../utils/catchAsync';
import jwt, { JwtPayload } from 'jsonwebtoken';

const studentAuth = () => {
  return catchAsync(async (req, res, next) => {
    const bearerToken = req.headers.authorization;

    if (!bearerToken) {
      return res.status(401).json({
        statusCode: 401,
        success: false,
        message: 'You are not authorized to access this route',
      });
    }

    const token = bearerToken.split(' ')[1];

    const decoded = jwt.verify(
      token,
      configs.jwtAccessSecret as string,
    ) as JwtPayload;

    const { studentId } = decoded;

    // Student exist করে কিনা check করুন
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new AppError(404, 'Student not found');
    }

    // req-এ student info attach করুন
    req.user = decoded as JwtPayload;

    next();
  });
};

export default studentAuth;