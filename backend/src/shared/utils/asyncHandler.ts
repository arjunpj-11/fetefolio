import type { NextFunction, RequestHandler, Response } from 'express';

type AsyncController<TRequest> = (
  req: TRequest,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;
export const asyncHandler =
  <TRequest>(handler: AsyncController<TRequest>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req as unknown as TRequest, res, next)).catch(next);
  };
