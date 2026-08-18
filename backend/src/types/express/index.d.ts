import type { HydratedDocument } from 'mongoose';
import type { IUser } from '../../modules/auth/auth.types.js';

declare global {
  namespace Express {
    interface Request {
      user: HydratedDocument<IUser>;
    }
  }
}
export {};
