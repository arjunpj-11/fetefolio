import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import type { IAuthPayload, IRegistrationPending, IUserPublic } from '@programme/contracts';
import { env } from '../../shared/config/env.js';
import { sendRegistrationOtp } from '../../shared/config/mailer.js';
import { ApiError } from '../../shared/utils/ApiError.js';
import { UserModel } from './auth.model.js';
import { registrationStore, type IPendingRegistration } from './registration.store.js';
import type {
  ITokenPayload,
  LoginDTO,
  RegisterDTO,
  ResendRegistrationOtpDTO,
  VerifyRegistrationDTO,
  IUser,
} from './auth.types.js';
import type { HydratedDocument } from 'mongoose';

const SALT_ROUNDS = 12;
export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS);
export const comparePassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);
export const generateToken = (user: Pick<IUser, '_id' | 'role'>): string =>
  jwt.sign(
    { userId: user._id.toString(), role: user.role } satisfies ITokenPayload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as NonNullable<jwt.SignOptions['expiresIn']> },
  );
export const verifyJwt = (token: string): ITokenPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as ITokenPayload;
  } catch {
    throw new ApiError(401, 'Invalid or expired authentication token');
  }
};
export const toPublicUser = (user: HydratedDocument<IUser>): IUserPublic => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt.toISOString(),
});

export const generateRegistrationOtp = (): string =>
  randomInt(0, 1_000_000).toString().padStart(6, '0');
export const createOtpDigest = (email: string, otp: string): string =>
  createHmac('sha256', env.OTP_SECRET).update(`${email}:${otp}`).digest('hex');
export const compareOtp = (email: string, otp: string, digest: string): boolean => {
  const expected = Buffer.from(digest, 'hex');
  const actual = Buffer.from(createOtpDigest(email, otp), 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

const pendingResponse = (email: string): IRegistrationPending => ({
  email,
  expiresInSeconds: env.OTP_TTL_SECONDS,
  resendAvailableInSeconds: env.OTP_RESEND_COOLDOWN_SECONDS,
});

const deliverOtp = async (registration: IPendingRegistration, otp: string): Promise<void> => {
  await sendRegistrationOtp({
    to: registration.email,
    name: registration.name,
    otp,
    expiresInMinutes: Math.ceil(env.OTP_TTL_SECONDS / 60),
  });
};

export const requestRegistration = async (dto: RegisterDTO): Promise<IRegistrationPending> => {
  if (await UserModel.exists({ email: dto.email }))
    throw new ApiError(409, 'An account with this email already exists');
  const otp = generateRegistrationOtp();
  const now = Date.now();
  const pending: IPendingRegistration = {
    name: dto.name,
    email: dto.email,
    passwordHash: await hashPassword(dto.password),
    otpDigest: createOtpDigest(dto.email, otp),
    attempts: 0,
    createdAt: now,
    lastSentAt: now,
    expiresAt: now + env.OTP_TTL_SECONDS * 1000,
  };
  await registrationStore.save(pending, env.OTP_TTL_SECONDS);
  try {
    await deliverOtp(pending, otp);
  } catch (error) {
    await registrationStore.remove(dto.email);
    throw error;
  }
  return pendingResponse(dto.email);
};

export const resendRegistrationOtp = async (
  dto: ResendRegistrationOtpDTO,
): Promise<IRegistrationPending> => {
  const existing = await registrationStore.find(dto.email);
  if (!existing || existing.expiresAt <= Date.now())
    throw new ApiError(400, 'Registration expired. Please enter your details again');
  const elapsedSeconds = Math.floor((Date.now() - existing.lastSentAt) / 1000);
  if (elapsedSeconds < env.OTP_RESEND_COOLDOWN_SECONDS) {
    throw new ApiError(
      429,
      `Wait ${env.OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds} seconds before requesting another code`,
    );
  }
  const otp = generateRegistrationOtp();
  const now = Date.now();
  const refreshed: IPendingRegistration = {
    ...existing,
    otpDigest: createOtpDigest(existing.email, otp),
    attempts: 0,
    lastSentAt: now,
    expiresAt: now + env.OTP_TTL_SECONDS * 1000,
  };
  await registrationStore.save(refreshed, env.OTP_TTL_SECONDS);
  try {
    await deliverOtp(refreshed, otp);
  } catch (error) {
    const remainingSeconds = Math.max(1, Math.ceil((existing.expiresAt - Date.now()) / 1000));
    await registrationStore.save(existing, remainingSeconds);
    throw error;
  }
  return pendingResponse(existing.email);
};

export const verifyRegistration = async (dto: VerifyRegistrationDTO): Promise<IAuthPayload> => {
  const pending = await registrationStore.find(dto.email);
  if (!pending || pending.expiresAt <= Date.now())
    throw new ApiError(400, 'Invalid or expired verification code');
  if (!compareOtp(dto.email, dto.otp, pending.otpDigest)) {
    const attempts = pending.attempts + 1;
    if (attempts >= env.OTP_MAX_ATTEMPTS) await registrationStore.remove(dto.email);
    else
      await registrationStore.save(
        { ...pending, attempts },
        Math.max(1, Math.ceil((pending.expiresAt - Date.now()) / 1000)),
      );
    throw new ApiError(400, 'Invalid or expired verification code');
  }
  if (await UserModel.exists({ email: pending.email })) {
    await registrationStore.remove(pending.email);
    throw new ApiError(409, 'An account with this email already exists');
  }
  const user = await UserModel.create({
    name: pending.name,
    email: pending.email,
    password: pending.passwordHash,
  });
  await registrationStore.remove(pending.email);
  return { user: toPublicUser(user), token: generateToken(user) };
};
export const login = async (dto: LoginDTO): Promise<IAuthPayload> => {
  const user = await UserModel.findOne({ email: dto.email }).select('+password');
  if (!user || !(await comparePassword(dto.password, user.password)))
    throw new ApiError(401, 'Invalid email or password');
  return { user: toPublicUser(user), token: generateToken(user) };
};
export const getUserById = async (id: string): Promise<HydratedDocument<IUser>> => {
  const user = await UserModel.findById(id);
  if (!user) throw new ApiError(401, 'Account no longer exists');
  return user;
};
