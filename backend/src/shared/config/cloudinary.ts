import { createHash } from 'node:crypto';
import type { ICloudinaryUploadSignature } from '@programme/contracts';
import { ApiError } from '../utils/ApiError.js';
import { env } from './env.js';

const folder = 'fetefolio/services';
const allowedFormats = 'jpg,jpeg,png,webp,avif';

export const createCloudinaryUploadSignature = (): ICloudinaryUploadSignature => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new ApiError(
      503,
      'Image uploads are not configured. Add the Cloudinary credentials to the backend environment.',
    );
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const valueToSign = `allowed_formats=${allowedFormats}&folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
  const signature = createHash('sha1').update(valueToSign).digest('hex');
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    allowedFormats,
  };
};
