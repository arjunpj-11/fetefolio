import { createHash } from 'node:crypto';
import { redisClient } from '../../shared/config/redis.js';

export interface IPendingRegistration {
  name: string;
  email: string;
  passwordHash: string;
  otpDigest: string;
  attempts: number;
  createdAt: number;
  lastSentAt: number;
  expiresAt: number;
}

export interface IRegistrationStore {
  find(email: string): Promise<IPendingRegistration | null>;
  save(registration: IPendingRegistration, ttlSeconds: number): Promise<void>;
  remove(email: string): Promise<void>;
}

const registrationKey = (email: string): string =>
  `auth:registration:${createHash('sha256').update(email).digest('hex')}`;

export const registrationStore: IRegistrationStore = {
  async find(email) {
    const value = await redisClient.get(registrationKey(email));
    if (!value) return null;
    try {
      return JSON.parse(value) as IPendingRegistration;
    } catch {
      await redisClient.del(registrationKey(email));
      return null;
    }
  },
  async save(registration, ttlSeconds) {
    await redisClient.set(registrationKey(registration.email), JSON.stringify(registration), {
      EX: ttlSeconds,
    });
  },
  async remove(email) {
    await redisClient.del(registrationKey(email));
  },
};
