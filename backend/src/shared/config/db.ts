import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDatabase = async (): Promise<void> => {
  await mongoose.connect(env.MONGODB_URI);
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
