import { NextFunction, Request, RequestHandler, Response } from 'express';

const catchAsync = (
  fn: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<Response | void>,
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => next(error));
  };
};

export default catchAsync;
