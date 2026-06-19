import prisma from '../../db/db.config';
import configs from '../configs';
import AppError from '../errors/AppError';
import catchAsync from '../utils/catchAsync';
import jwt, { JwtPayload } from 'jsonwebtoken';

const authTeacher = () => {
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

    if (decoded.role !== 'TEACHER') {
      throw new AppError(403, 'You are not authorized to access this route');
    }

    const teacher = await prisma.teacher.findUnique({
      where: { regNo: decoded.regNo },
    });

    if (!teacher) {
      throw new AppError(404, 'Teacher not found');
    }

    req.user = decoded as JwtPayload;

    next();
  });
};

export default authTeacher;