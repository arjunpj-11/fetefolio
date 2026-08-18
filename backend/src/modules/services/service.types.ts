import type {
  BlockServiceDatesDTO,
  CreateServiceDTO,
  ServiceQueryDTO,
  UpdateServiceDTO,
} from '@programme/contracts';
import type { Types } from 'mongoose';
export type { BlockServiceDatesDTO, CreateServiceDTO, ServiceQueryDTO, UpdateServiceDTO };
export interface IServiceDocument {
  _id: Types.ObjectId;
  title: string;
  category: string;
  description: string;
  pricePerDay: number;
  location: { city: string; state: string; address: string };
  images: string[];
  contactDetails: { phone: string; email: string };
  rating: number;
  capacity?: number;
  adminContactPhone?: string;
  blockedDateRanges: { _id: Types.ObjectId; startDate: Date; endDate: Date }[];
  provider: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
