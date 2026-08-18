import 'dotenv/config';
import { z } from 'zod';

const developmentJwtSecret = 'development-only-secret-change-me';
const developmentOtpSecret = 'development-otp-secret-change-me';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(5055),
    MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/the-programme'),
    JWT_SECRET: z.string().min(16).default(developmentJwtSecret),
    JWT_EXPIRES_IN: z.string().default('7d'),
    REDIS_URL: z.string().url().default('redis://127.0.0.1:6379'),
    OTP_SECRET: z.string().min(16).default(developmentOtpSecret),
    OTP_TTL_SECONDS: z.coerce.number().int().min(300).max(1800).default(600),
    OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().min(30).max(300).default(60),
    OTP_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(10).default(5),
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    MAIL_FROM: z.string().default('bookings@fetefolio.local'),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV !== 'production') return;
    if (value.JWT_SECRET === developmentJwtSecret || value.JWT_SECRET.length < 32)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'Production JWT_SECRET must be a unique value of at least 32 characters',
      });
    if (value.OTP_SECRET === developmentOtpSecret || value.OTP_SECRET.length < 32)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['OTP_SECRET'],
        message: 'Production OTP_SECRET must be a unique value of at least 32 characters',
      });
  });

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
export const env = parsed.data;
