import type { RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError.js';
export const requireAdmin: RequestHandler = (req, _res, next) =>
  req.user.role === 'admin' ? next() : next(new ApiError(403, 'Administrator access required'));
export const requireUser: RequestHandler = (req, _res, next) =>
  req.user.role === 'user' ? next() : next(new ApiError(403, 'Customer access required'));
