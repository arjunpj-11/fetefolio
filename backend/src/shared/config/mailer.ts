import nodemailer from 'nodemailer';
import { env } from './env.js';
import { ApiError } from '../utils/ApiError.js';

const deliveryTimeoutMs = 10_000;

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      connectionTimeout: deliveryTimeoutMs,
      greetingTimeout: deliveryTimeoutMs,
      socketTimeout: deliveryTimeoutMs,
    })
  : null;

interface IEmailMessage {
  to: string;
  subject: string;
  text: string;
}

type Fetcher = typeof fetch;

export const sendWithResend = async (
  message: IEmailMessage,
  apiKey: string,
  fetcher: Fetcher = fetch,
): Promise<void> => {
  const response = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: env.MAIL_FROM, ...message }),
    signal: AbortSignal.timeout(deliveryTimeoutMs),
  });
  if (!response.ok) throw new Error(`Email API returned HTTP ${response.status}`);
};

const deliverEmail = async (message: IEmailMessage, preview: string): Promise<void> => {
  try {
    if (env.RESEND_API_KEY) {
      await sendWithResend(message, env.RESEND_API_KEY);
      return;
    }
    if (transporter) {
      await transporter.sendMail({ from: env.MAIL_FROM, ...message });
      return;
    }
    if (env.NODE_ENV !== 'production') {
      if (env.NODE_ENV === 'development') console.info(`[mail preview] ${preview}`);
      return;
    }
    throw new Error('No production email provider is configured');
  } catch (error) {
    if (env.NODE_ENV !== 'test')
      console.error('Email delivery failed', error instanceof Error ? error.message : error);
    throw new ApiError(
      503,
      'Email delivery is temporarily unavailable. Please try again shortly',
    );
  }
};

export interface IBookingEmail {
  to: string;
  name: string;
  serviceTitle: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  bookingCode: string;
}
export interface IBookingRejectionEmail extends IBookingEmail {
  reason: string;
}
export interface IBookingCancellationEmail extends IBookingEmail {
  reason: string;
}
export interface IRegistrationOtpEmail {
  to: string;
  name: string;
  otp: string;
  expiresInMinutes: number;
}

export const sendRegistrationOtp = async (message: IRegistrationOtpEmail): Promise<void> => {
  await deliverEmail(
    {
      to: message.to,
      subject: 'Verify your email — Fetefolio',
      text: `Hello ${message.name},\n\nYour verification code is ${message.otp}. It expires in ${message.expiresInMinutes} minutes. If you did not request this code, you can ignore this email.\n\nFetefolio`,
    },
    `registration OTP ${message.otp} for ${message.to}`,
  );
};

export const sendBookingConfirmation = async (booking: IBookingEmail): Promise<void> => {
  await deliverEmail(
    {
      to: booking.to,
      subject: `Booking confirmed — ${booking.serviceTitle}`,
      text: `Hello ${booking.name},\n\nYour booking ${booking.bookingCode} for ${booking.serviceTitle} is confirmed from ${booking.startDate.toDateString()} to ${booking.endDate.toDateString()}. Total: ₹${booking.totalPrice.toLocaleString('en-IN')}.\n\nFetefolio`,
    },
    `booking ${booking.bookingCode} for ${booking.to}`,
  );
};

export const sendBookingRejection = async (booking: IBookingRejectionEmail): Promise<void> => {
  await deliverEmail(
    {
      to: booking.to,
      subject: `Booking request declined — ${booking.serviceTitle}`,
      text: `Hello ${booking.name},\n\nYour booking request ${booking.bookingCode} for ${booking.serviceTitle}, from ${booking.startDate.toDateString()} to ${booking.endDate.toDateString()}, was declined.\n\nReason: ${booking.reason}\n\nYou can return to Fetefolio to choose another service or date.\n\nFetefolio`,
    },
    `booking rejection ${booking.bookingCode} for ${booking.to}: ${booking.reason}`,
  );
};

export const sendBookingCancellation = async (
  booking: IBookingCancellationEmail,
): Promise<void> => {
  await deliverEmail(
    {
      to: booking.to,
      subject: `Booking cancelled — ${booking.serviceTitle}`,
      text: `Hello ${booking.name},\n\nYour confirmed booking ${booking.bookingCode} for ${booking.serviceTitle}, from ${booking.startDate.toDateString()} to ${booking.endDate.toDateString()}, was cancelled by the provider.\n\nReason: ${booking.reason}\n\nPlease contact the provider if you need further assistance.\n\nFetefolio`,
    },
    `booking cancellation ${booking.bookingCode} for ${booking.to}: ${booking.reason}`,
  );
};
