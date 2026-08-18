import { Types } from 'mongoose';
import {
  compareOtp,
  comparePassword,
  createOtpDigest,
  generateRegistrationOtp,
  generateToken,
  hashPassword,
  resendRegistrationOtp,
  verifyJwt,
} from '../../src/modules/auth/auth.service.js';
import {
  registrationStore,
  type IPendingRegistration,
} from '../../src/modules/auth/registration.store.js';
describe('auth cryptography', () => {
  it('hashes and compares passwords without storing plaintext', async () => {
    const hash = await hashPassword('Programme123');
    expect(hash).not.toContain('Programme123');
    await expect(comparePassword('Programme123', hash)).resolves.toBe(true);
    await expect(comparePassword('Wrong123', hash)).resolves.toBe(false);
  });
  it('generates verifiable JWTs with user role', () => {
    const id = new Types.ObjectId();
    const token = generateToken({ _id: id, role: 'admin' });
    expect(verifyJwt(token)).toMatchObject({ userId: id.toString(), role: 'admin' });
  });
  it('generates six-digit OTPs and compares only their secure digests', () => {
    const otp = generateRegistrationOtp();
    expect(otp).toMatch(/^\d{6}$/);
    const digest = createOtpDigest('guest@example.com', otp);
    expect(digest).not.toContain(otp);
    expect(compareOtp('guest@example.com', otp, digest)).toBe(true);
    expect(compareOtp('guest@example.com', '000000', digest)).toBe(otp === '000000');
    expect(compareOtp('different@example.com', otp, digest)).toBe(false);
  });
});

describe('registration OTP resend', () => {
  afterEach(() => jest.restoreAllMocks());

  const pendingRegistration = (
    overrides: Partial<IPendingRegistration> = {},
  ): IPendingRegistration => ({
    name: 'Guest User',
    email: 'guest@example.com',
    passwordHash: 'stored-password-hash',
    otpDigest: createOtpDigest('guest@example.com', '123456'),
    attempts: 3,
    createdAt: Date.now() - 120_000,
    lastSentAt: Date.now() - 61_000,
    expiresAt: Date.now() + 600_000,
    ...overrides,
  });

  it('rejects resend requests during the cooldown without changing the stored code', async () => {
    jest
      .spyOn(registrationStore, 'find')
      .mockResolvedValue(pendingRegistration({ lastSentAt: Date.now() }));
    const save = jest.spyOn(registrationStore, 'save').mockResolvedValue();

    await expect(resendRegistrationOtp({ email: 'guest@example.com' })).rejects.toMatchObject({
      statusCode: 429,
      message: expect.stringContaining('Wait'),
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('rejects resend requests after the pending registration expires', async () => {
    jest.spyOn(registrationStore, 'find').mockResolvedValue(null);

    await expect(resendRegistrationOtp({ email: 'guest@example.com' })).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('expired'),
    });
  });

  it('rotates the code, resets attempts and refreshes the expiry after cooldown', async () => {
    const existing = pendingRegistration();
    jest.spyOn(registrationStore, 'find').mockResolvedValue(existing);
    const save = jest.spyOn(registrationStore, 'save').mockResolvedValue();

    const result = await resendRegistrationOtp({ email: existing.email });

    expect(result).toMatchObject({ email: existing.email, resendAvailableInSeconds: 60 });
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: existing.email,
        attempts: 0,
        otpDigest: expect.not.stringMatching(existing.otpDigest),
        lastSentAt: expect.any(Number),
        expiresAt: expect.any(Number),
      }),
      600,
    );
  });
});
