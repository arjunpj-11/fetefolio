import type { RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { getUserById, verifyJwt } from '../../modules/auth/auth.service.js';

export const verifyToken: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'Authentication required');
    req.user = await getUserById(verifyJwt(header.slice(7)).userId);
    next();
  } catch (error) {
    next(error);
  }
};
