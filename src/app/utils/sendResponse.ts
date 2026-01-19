import { Response } from 'express';

type TMeta = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
};

type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: TMeta;
  data?: T;
  token?: {
    accessToken: string;
    refreshToken: string;
  };
};

const sendResponse = <T>(res: Response, data: TResponse<T>) => {
  const responseData: TResponse<T> = {
    success: data.success,
    statusCode: data.statusCode,
    message: data.message,
    ...(data.meta && { meta: data.meta }),
    ...(data.data && { data: data.data }),
  };

  if (data.token) {
    responseData.token = {
      accessToken: data.token.accessToken,
      refreshToken: data.token.refreshToken,
    };
  }
  res.status(data.statusCode).json(responseData);
};

export default sendResponse;
