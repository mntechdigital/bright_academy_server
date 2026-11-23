import { ZodError, ZodIssue } from 'zod';
import { TErrorSources, TGenericErrorResponse } from '../types/errors.type';

const handleZodError = (error: ZodError): TGenericErrorResponse => {
  const statusCode = 400;
  const errorSources: TErrorSources = error.issues.map((issue: ZodIssue) => {
    const path = issue.path.filter((p) => p !== "body").join(".");
    return {
      path: path || issue.path[issue.path.length - 1],
      message: issue.message,
    };
  });

  const first = errorSources[0];
  const message = first?.path
    ? `Validation error: ${first.path} - ${first.message}`
    : first?.message || "Validation error";

  return {
    statusCode,
    message,
    errorSources,
  };
};

export default handleZodError;
