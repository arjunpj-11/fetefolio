import type {
  BookingContactDetails,
  BookingListQueryDTO,
  CancelBookingDTO,
  ConfirmBookingDTO,
  CreateBookingDTO,
  RejectBookingDTO,
} from '@programme/contracts';
import type { Types } from 'mongoose';
export type {
  BookingListQueryDTO,
  CancelBookingDTO,
  ConfirmBookingDTO,
  CreateBookingDTO,
  RejectBookingDTO,
};
export interface IBookingDocument {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  service: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  totalPrice: number;
  contactDetails?: BookingContactDetails;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
