import type { Request, Response } from 'express';
import { ApiResponse } from '../../shared/utils/ApiResponse.js';
import {
  login,
  requestRegistration,
  resendRegistrationOtp,
  toPublicUser,
  verifyRegistration,
} from './auth.service.js';
import type {
  LoginDTO,
  RegisterDTO,
  ResendRegistrationOtpDTO,
  VerifyRegistrationDTO,
} from './auth.types.js';

export const registerController = async (
  req: Request<object, object, RegisterDTO>,
  res: Response,
): Promise<void> => {
  res
    .status(202)
    .json(new ApiResponse(await requestRegistration(req.body), 'Verification code sent'));
};
export const verifyRegistrationController = async (
  req: Request<object, object, VerifyRegistrationDTO>,
  res: Response,
): Promise<void> => {
  res
    .status(201)
    .json(
      new ApiResponse(await verifyRegistration(req.body), 'Email verified and account created'),
    );
};
export const resendRegistrationOtpController = async (
  req: Request<object, object, ResendRegistrationOtpDTO>,
  res: Response,
): Promise<void> => {
  res.json(
    new ApiResponse(await resendRegistrationOtp(req.body), 'A new verification code was sent'),
  );
};
export const loginController = async (
  req: Request<object, object, LoginDTO>,
  res: Response,
): Promise<void> => {
  res.json(new ApiResponse(await login(req.body), 'Welcome back'));
};
export const meController = async (req: Request, res: Response): Promise<void> => {
  res.json(new ApiResponse(toPublicUser(req.user), 'Profile loaded'));
};
