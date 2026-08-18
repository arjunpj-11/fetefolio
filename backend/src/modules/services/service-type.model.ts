import { Schema, model } from 'mongoose';
import type { ServiceTypeIconName } from '@programme/contracts';

export interface IServiceTypeDocument {
  _id: Schema.Types.ObjectId;
  slug: string;
  label: string;
  normalizedName: string;
  singular: string;
  description: string;
  capacityLabel?: string;
  dateLabel: string;
  icon: ServiceTypeIconName;
  createdAt: Date;
  updatedAt: Date;
}

const serviceTypeSchema = new Schema<IServiceTypeDocument>(
  {
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    label: { type: String, required: true, trim: true, maxlength: 60 },
    normalizedName: { type: String, required: true, unique: true, select: false },
    singular: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, required: true, trim: true, maxlength: 240 },
    capacityLabel: { type: String, trim: true, maxlength: 60 },
    dateLabel: { type: String, required: true, trim: true, maxlength: 60, default: 'Event dates' },
    icon: {
      type: String,
      enum: [
        'sparkles',
        'venue',
        'stay',
        'catering',
        'photography',
        'music',
        'decor',
        'flowers',
        'cake',
        'transport',
        'tent',
        'entertainment',
        'lighting',
        'beauty',
      ],
      default: 'sparkles',
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

export const ServiceTypeModel = model<IServiceTypeDocument>('ServiceType', serviceTypeSchema);
