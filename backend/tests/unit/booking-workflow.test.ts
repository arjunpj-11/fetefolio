import { Types } from 'mongoose';
import { BookingModel } from '../../src/modules/bookings/booking.model.js';
import {
  cancelBooking,
  confirmBooking,
  createBooking,
  rejectBooking,
} from '../../src/modules/bookings/booking.service.js';
import type { IBookingDocument } from '../../src/modules/bookings/booking.types.js';
import { ServiceModel } from '../../src/modules/services/service.model.js';

const serviceId = new Types.ObjectId();
const providerId = new Types.ObjectId();
const userId = new Types.ObjectId();

const service = {
  _id: serviceId,
  provider: providerId,
  title: 'Marigold Courtyard',
  category: 'venue',
  pricePerDay: 10_000,
  contactDetails: { phone: '+91 98765 41111', email: 'venue@example.com' },
  adminContactPhone: '+91 90000 11111',
  blockedDateRanges: [],
  isActive: true,
  save: jest.fn().mockResolvedValue(undefined),
};

const pendingBooking = () => ({
  _id: new Types.ObjectId(),
  user: userId,
  service: serviceId,
  startDate: new Date('2099-12-10T00:00:00.000Z'),
  endDate: new Date('2099-12-12T23:59:59.999Z'),
  totalDays: 3,
  totalPrice: 30_000,
  contactDetails: { name: 'Anika Sharma', phone: '+91 98765 43210', email: 'anika@example.com' },
  status: 'pending' as const,
  createdAt: new Date('2099-01-01T00:00:00.000Z'),
  save: jest.fn().mockResolvedValue(undefined),
});

describe('booking approval workflow', () => {
  afterEach(() => jest.restoreAllMocks());

  it('creates a booking request as pending', async () => {
    const booking = pendingBooking();
    jest.spyOn(ServiceModel, 'findById').mockResolvedValue(service as never);
    const create = jest.spyOn(BookingModel, 'create').mockResolvedValue(booking as never);

    const result = await createBooking(
      {
        serviceId: serviceId.toString(),
        startDate: '2099-12-10',
        endDate: '2099-12-12',
        contactDetails: booking.contactDetails,
      },
      { id: userId.toString(), name: 'Anika Sharma', email: 'anika@example.com' },
    );

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
    expect(result.status).toBe('pending');
    expect(typeof result.service === 'string' ? undefined : result.service.contactDetails).toEqual(
      service.contactDetails,
    );
    expect(
      typeof result.service === 'string' ? undefined : result.service.adminContactPhone,
    ).toBeUndefined();
  });

  it('lets the owning provider confirm a pending request', async () => {
    const booking = pendingBooking();
    jest.spyOn(BookingModel, 'findById').mockResolvedValue(booking as never);
    jest.spyOn(ServiceModel, 'findById').mockResolvedValue(service as never);
    const result = await confirmBooking(booking._id.toString(), providerId.toString());

    expect(booking.status).toBe('confirmed');
    expect(booking.save).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('confirmed');
    expect(typeof result.service === 'string' ? undefined : result.service.adminContactPhone).toBe(
      service.adminContactPhone,
    );
  });

  it('normalizes legacy booking totals to the inclusive date count when returning a booking', async () => {
    const booking = { ...pendingBooking(), totalDays: 2, totalPrice: 20_000 };
    jest.spyOn(BookingModel, 'findById').mockResolvedValue(booking as never);
    jest.spyOn(ServiceModel, 'findById').mockResolvedValue(service as never);

    const result = await confirmBooking(booking._id.toString(), providerId.toString());

    expect(result.totalDays).toBe(3);
    expect(result.totalPrice).toBe(30_000);
  });

  it('requires rejection to be stored with the provider reason', async () => {
    const booking = pendingBooking();
    jest.spyOn(BookingModel, 'findById').mockResolvedValue(booking as never);
    jest.spyOn(ServiceModel, 'findById').mockResolvedValue(service as never);

    const result = await rejectBooking(booking._id.toString(), providerId.toString(), {
      reason: '  Closed for maintenance.  ',
    });

    expect(booking.status).toBe('rejected');
    expect((booking as typeof booking & { rejectionReason?: string }).rejectionReason).toBe(
      'Closed for maintenance.',
    );
    expect(booking.save).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      status: 'rejected',
      rejectionReason: 'Closed for maintenance.',
    });
  });

  it('lets the owning provider cancel a confirmed booking with a reason', async () => {
    const booking = { ...pendingBooking(), status: 'confirmed' as IBookingDocument['status'] };
    jest.spyOn(BookingModel, 'findById').mockResolvedValue(booking as never);
    jest.spyOn(ServiceModel, 'findById').mockResolvedValue(service as never);

    const result = await cancelBooking(booking._id.toString(), providerId.toString(), {
      reason: '  The hall is closed for emergency repairs.  ',
    });

    expect(booking.status).toBe('cancelled');
    expect((booking as typeof booking & { cancellationReason?: string }).cancellationReason).toBe(
      'The hall is closed for emergency repairs.',
    );
    expect(booking.save).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      status: 'cancelled',
      cancellationReason: 'The hall is closed for emergency repairs.',
    });
  });

  it('does not cancel a booking that has not been confirmed', async () => {
    const booking = pendingBooking();
    jest.spyOn(BookingModel, 'findById').mockResolvedValue(booking as never);
    jest.spyOn(ServiceModel, 'findById').mockResolvedValue(service as never);

    await expect(
      cancelBooking(booking._id.toString(), providerId.toString(), {
        reason: 'The provider is unavailable.',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('allows another request to be confirmed for the same dates when inventory remains', async () => {
    const booking = pendingBooking();
    jest.spyOn(BookingModel, 'findById').mockResolvedValue(booking as never);
    jest.spyOn(ServiceModel, 'findById').mockResolvedValue(service as never);
    const exists = jest.spyOn(BookingModel, 'exists');

    await expect(
      confirmBooking(booking._id.toString(), providerId.toString()),
    ).resolves.toMatchObject({ status: 'confirmed' });
    expect(exists).not.toHaveBeenCalled();
  });

  it('can confirm and stop new requests for only part of the requested dates', async () => {
    const booking = pendingBooking();
    const managedService = {
      ...service,
      blockedDateRanges: [],
      save: jest.fn().mockResolvedValue(undefined),
    };
    jest.spyOn(BookingModel, 'findById').mockResolvedValue(booking as never);
    jest.spyOn(ServiceModel, 'findById').mockResolvedValue(managedService as never);

    await confirmBooking(booking._id.toString(), providerId.toString(), {
      blockDates: { startDate: '2099-12-10', endDate: '2099-12-11' },
    });

    expect(booking.status).toBe('confirmed');
    expect(managedService.blockedDateRanges).toEqual([
      expect.objectContaining({
        startDate: new Date('2099-12-10T00:00:00.000Z'),
        endDate: new Date('2099-12-11T23:59:59.999Z'),
      }),
    ]);
    expect(managedService.save).toHaveBeenCalledTimes(1);
  });

  it('does not accept a request for dates the provider blocked', async () => {
    jest.spyOn(ServiceModel, 'findById').mockResolvedValue({
      ...service,
      blockedDateRanges: [
        {
          _id: new Types.ObjectId(),
          startDate: new Date('2099-12-11T00:00:00.000Z'),
          endDate: new Date('2099-12-11T23:59:59.999Z'),
        },
      ],
    } as never);
    await expect(
      createBooking(
        {
          serviceId: serviceId.toString(),
          startDate: '2099-12-10',
          endDate: '2099-12-12',
          contactDetails: {
            name: 'Anika Sharma',
            phone: '+91 98765 43210',
            email: 'anika@example.com',
          },
        },
        { id: userId.toString(), name: 'Anika Sharma', email: 'anika@example.com' },
      ),
    ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining('unavailable') });
  });
});
