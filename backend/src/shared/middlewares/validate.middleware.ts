import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { ApiError } from '../utils/ApiError.js';

type Target = 'body' | 'query' | 'params';
export const validate =
  (schema: ZodTypeAny, target: Target = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      next(new ApiError(400, 'Validation failed', result.error.flatten()));
      return;
    }
    if (target === 'body') req.body = result.data;
    else if (target === 'params') req.params = result.data;
    else Object.assign(req.query, result.data);
    next();
  };
