import { Schema, model } from 'mongoose';
import type { IBookingDocument } from './booking.types.js';

const bookingSchema = new Schema<IBookingDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    contactDetails: {
      name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
      phone: { type: String, required: true, trim: true, minlength: 7, maxlength: 20 },
      email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
      note: { type: String, trim: true, maxlength: 500 },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
      required: true,
    },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
    cancellationReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true, versionKey: false },
);
bookingSchema.index({ service: 1, status: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ user: 1, startDate: -1 });

export const BookingModel = model<IBookingDocument>('Booking', bookingSchema);
