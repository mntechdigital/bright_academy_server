import { Request, Response } from 'express';

const notFoundErrorHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Not Found',
    error: {
      statusCode: 404,
      message: 'The requested resource was not found on this server.',
    },
  });
};

export default notFoundErrorHandler;
