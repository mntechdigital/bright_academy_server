/* eslint-disable @typescript-eslint/no-unused-vars */
import { ErrorRequestHandler } from 'express';
import { TErrorSources } from '../types/errors.type';
import { ZodError } from 'zod';
import handleZodError from '../errors/handleZodError';
import { Prisma } from '@prisma/client';
import { handlePrismaError } from '../errors/handlePrismaError';
import AppError from '../errors/AppError';

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next,
) => {
  let statusCode: number = 500;
  let message: string = 'Internal server error';
  let errorSources: TErrorSources = [
    {
      path: '',
      message: 'Internal server error',
    },
  ];

  if (error instanceof ZodError) {
    const errors = handleZodError(error);
    statusCode = errors?.statusCode;
    message = errors?.message;
    errorSources = errors?.errorSources;
  } else if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError
  ) {
    const errors = handlePrismaError(error);
    statusCode = errors?.statusCode;
    message = errors?.message;
    errorSources = errors?.errorSources;
  } else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    errorSources = [
      {
        path: '',
        message: error.message,
      },
    ];
  } else if (error instanceof Error) {
    message = error.message;
    errorSources = [
      {
        path: '',
        message: error.message,
      },
    ];
  }

  res.status(statusCode).json({
    statusCode,
    message,
    errorSources,
    stack: error.stack ? error.stack : null,
  });
};
