import { ZodError, ZodIssue } from 'zod';
import { TErrorSources, TGenericErrorResponse } from '../types/errors.type';

const handleZodError = (error: ZodError): TGenericErrorResponse => {
  const statusCode = 400;
  const errorSources: TErrorSources = error.issues.map((issue: ZodIssue) => {
    return {
      path: issue.path[issue.path.length - 1],
      message: issue.message,
    };
  });

  return {
    statusCode,
    message: 'Validation error',
    errorSources,
  };
};

export default handleZodError;
