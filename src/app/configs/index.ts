import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.join(process.cwd(), '.env'),
});

export default {
  port: process.env.PORT,
  password: process.env.DEFAULT_PASS,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES,
  serverUrl: process.env.SERVER_URL,
  clientUrl: process.env.CLIENT_URL,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPass: process.env.ADMIN_PASS,
  adminFullName: process.env.ADMIN_FULLNAME,
  password_salt_rounds: 10,
};
