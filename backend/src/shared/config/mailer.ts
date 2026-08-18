import nodemailer from 'nodemailer';
import { env } from './env.js';

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

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
  if (!transporter) {
    if (env.NODE_ENV === 'development')
      console.info(`[mail preview] registration OTP ${message.otp} for ${message.to}`);
    return;
  }
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: message.to,
    subject: 'Verify your email — Fetefolio',
    text: `Hello ${message.name},\n\nYour verification code is ${message.otp}. It expires in ${message.expiresInMinutes} minutes. If you did not request this code, you can ignore this email.\n\nFetefolio`,
  });
};

export const sendBookingConfirmation = async (booking: IBookingEmail): Promise<void> => {
  if (!transporter) {
    if (env.NODE_ENV === 'development')
      console.info(`[mail preview] booking ${booking.bookingCode} for ${booking.to}`);
    return;
  }
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: booking.to,
    subject: `Booking confirmed — ${booking.serviceTitle}`,
    text: `Hello ${booking.name},\n\nYour booking ${booking.bookingCode} for ${booking.serviceTitle} is confirmed from ${booking.startDate.toDateString()} to ${booking.endDate.toDateString()}. Total: ₹${booking.totalPrice.toLocaleString('en-IN')}.\n\nFetefolio`,
  });
};

export const sendBookingRejection = async (booking: IBookingRejectionEmail): Promise<void> => {
  if (!transporter) {
    if (env.NODE_ENV === 'development')
      console.info(
        `[mail preview] booking rejection ${booking.bookingCode} for ${booking.to}: ${booking.reason}`,
      );
    return;
  }
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: booking.to,
    subject: `Booking request declined — ${booking.serviceTitle}`,
    text: `Hello ${booking.name},\n\nYour booking request ${booking.bookingCode} for ${booking.serviceTitle}, from ${booking.startDate.toDateString()} to ${booking.endDate.toDateString()}, was declined.\n\nReason: ${booking.reason}\n\nYou can return to Fetefolio to choose another service or date.\n\nFetefolio`,
  });
};

export const sendBookingCancellation = async (
  booking: IBookingCancellationEmail,
): Promise<void> => {
  if (!transporter) {
    if (env.NODE_ENV === 'development')
      console.info(
        `[mail preview] booking cancellation ${booking.bookingCode} for ${booking.to}: ${booking.reason}`,
      );
    return;
  }
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: booking.to,
    subject: `Booking cancelled — ${booking.serviceTitle}`,
    text: `Hello ${booking.name},\n\nYour confirmed booking ${booking.bookingCode} for ${booking.serviceTitle}, from ${booking.startDate.toDateString()} to ${booking.endDate.toDateString()}, was cancelled by the provider.\n\nReason: ${booking.reason}\n\nPlease contact the provider if you need further assistance.\n\nFetefolio`,
  });
};
