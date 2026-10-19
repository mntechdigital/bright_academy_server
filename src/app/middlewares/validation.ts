import { ZodTypeAny } from 'zod';
import catchAsync from '../utils/catchAsync';

const validation = (schema: ZodTypeAny) => {
  return catchAsync(async (req, res, next) => {
    await schema.parseAsync({
      body: req.body,
    });

    next();
  });
};

export default validation;
