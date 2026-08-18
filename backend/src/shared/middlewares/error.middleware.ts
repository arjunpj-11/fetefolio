import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const notFoundHandler: RequestHandler = (req, _res, next) =>
  next(new ApiError(404, `Route ${req.method} ${req.path} not found`));

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = error.flatten();
  } else if (error instanceof Error && error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier';
  } else if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  ) {
    statusCode = 409;
    message = 'A record with that value already exists';
  }
  if (statusCode === 500 && process.env.NODE_ENV !== 'test') console.error(error);
  res
    .status(statusCode)
    .json({ success: false, data: null, message, ...(details ? { details } : {}) });
};
