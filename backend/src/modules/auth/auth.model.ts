import { Schema, model } from 'mongoose';
import type { IUser } from './auth.types.js';

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user', required: true },
  },
  { timestamps: true, versionKey: false },
);

export const UserModel = model<IUser>('User', userSchema);
