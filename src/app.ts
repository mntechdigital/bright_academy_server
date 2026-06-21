import express, { Application } from 'express';
import cors from 'cors';
import config from './app/configs';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import notFoundErrorHandler from './app/middlewares/notFoundErrorHandler';
import { seedRoleAdmin } from './app/utils/seedRoleAdmin';
import { seedTeachers } from './app/utils/seedTeacher';
import cookieParser from 'cookie-parser';
import router from './app/routes';

// Initialize the express application
const app: Application = express();

// Middleware to parse JSON bodies
app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'origin', 'accept'],
  }),
);
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware to parse cookies
app.use(cookieParser());

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Home route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the Backend in Bright Academy server!',
  });
});

// Importing routes
app.use('/api/v1', router);

// Error handling middleware
app.use(globalErrorHandler);

// 404 Not Found middleware
app.use(notFoundErrorHandler);

// Running the server
app.listen(config.port, () => {
  // Seed the admin role if it doesn't exist
  seedRoleAdmin();
  // Seed 30 teachers
  seedTeachers();
  console.log(`Server is running on port ${config.port}`);
});
