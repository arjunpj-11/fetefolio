import type {
  RegisterDTO,
  LoginDTO,
  ResendRegistrationOtpDTO,
  VerifyRegistrationDTO,
} from '@programme/contracts';
import type { Types } from 'mongoose';
export type { RegisterDTO, LoginDTO, ResendRegistrationOtpDTO, VerifyRegistrationDTO };
export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}
export interface ITokenPayload {
  userId: string;
  role: IUser['role'];
}
