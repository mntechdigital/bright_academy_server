import prisma from '../../db/db.config';
import configs from '../configs';
import AppError from '../errors/AppError';
import catchAsync from '../utils/catchAsync';
import jwt, { JwtPayload } from 'jsonwebtoken';

const auth = (requiredFeatures?: string[]) => {
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

    const decoded = jwt.verify(token, configs.jwtAccessSecret as string) as JwtPayload;

    const { email } = decoded;

    const user = await prisma.adminUser.findFirst({
      where: { email },
      include: {
        role: {
          include: {
            roleFeature: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (requiredFeatures && requiredFeatures.length > 0) {
      // ✅ Compare path instead of name
      const userFeatures = user.role.roleFeature.map((feature) => feature.path);

      const hasRequiredFeatures = requiredFeatures.every((feature) =>
        userFeatures.includes(feature),
      );

      if (!hasRequiredFeatures) {
        throw new AppError(403, 'You are not authorized to access this route');
      }
    }

    req.user = decoded as JwtPayload;

    next();
  });
};


export default auth;
