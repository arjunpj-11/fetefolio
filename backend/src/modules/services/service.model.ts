import { Schema, model } from 'mongoose';
import type { IServiceDocument } from './service.types.js';

const serviceSchema = new Schema<IServiceDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, trim: true, lowercase: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    pricePerDay: { type: Number, required: true, min: 1, index: true },
    location: {
      city: { type: String, required: true, trim: true, index: true },
      state: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
    },
    images: [{ type: String, trim: true }],
    contactDetails: {
      phone: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
    },
    adminContactPhone: { type: String, trim: true },
    rating: { type: Number, default: 4.5, min: 1, max: 5, index: true },
    capacity: { type: Number, index: true },
    blockedDateRanges: [
      {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
      },
    ],
    provider: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false },
);
serviceSchema.index({ title: 'text', description: 'text' });
serviceSchema.index({ title: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
serviceSchema.index({ category: 1, 'location.city': 1, pricePerDay: 1, rating: -1 });

export const ServiceModel = model<IServiceDocument>('Service', serviceSchema);
