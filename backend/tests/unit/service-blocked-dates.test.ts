import { Types } from 'mongoose';
import { ServiceModel } from '../../src/modules/services/service.model.js';
import {
  blockServiceDates,
  unblockServiceDates,
} from '../../src/modules/services/service.service.js';

const providerId = new Types.ObjectId();
const serviceId = new Types.ObjectId();

const serviceDocument = () => ({
  _id: serviceId,
  title: 'Marigold Courtyard',
  category: 'venue',
  description: 'A private courtyard for celebrations.',
  pricePerDay: 10_000,
  location: { city: 'Jaipur', state: 'Rajasthan', address: '22 Amer Road' },
  images: [],
  contactDetails: { phone: '+91 98765 41111', email: 'venue@example.com' },
  rating: 4.5,
  provider: providerId,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  blockedDateRanges: [] as { _id: Types.ObjectId; startDate: Date; endDate: Date }[],
  save: jest.fn().mockResolvedValue(undefined),
});

describe('admin blocked service dates', () => {
  afterEach(() => jest.restoreAllMocks());

  it('marks a future range unavailable for the owning provider', async () => {
    const service = serviceDocument();
    jest.spyOn(ServiceModel, 'findById').mockResolvedValue(service as never);
    const result = await blockServiceDates(
      serviceId.toString(),
      { startDate: '2099-08-10', endDate: '2099-08-12' },
      providerId.toString(),
    );

    expect(service.save).toHaveBeenCalledTimes(1);
    expect(service.blockedDateRanges).toHaveLength(1);
    expect(result.blockedDateRanges).toEqual([
      expect.objectContaining({ startDate: '2099-08-10', endDate: '2099-08-12' }),
    ]);
  });

  it('rejects a range that overlaps dates already blocked by the provider', async () => {
    const service = serviceDocument();
    service.blockedDateRanges.push({
      _id: new Types.ObjectId(),
      startDate: new Date('2099-08-11T00:00:00.000Z'),
      endDate: new Date('2099-08-13T23:59:59.999Z'),
    });
    jest.spyOn(ServiceModel, 'findById').mockResolvedValue(service as never);

    await expect(
      blockServiceDates(
        serviceId.toString(),
        { startDate: '2099-08-10', endDate: '2099-08-12' },
        providerId.toString(),
      ),
    ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining('overlap') });
    expect(service.save).not.toHaveBeenCalled();
  });

  it('makes a blocked range available again', async () => {
    const service = serviceDocument();
    const blockId = new Types.ObjectId();
    service.blockedDateRanges.push({
      _id: blockId,
      startDate: new Date('2099-08-10T00:00:00.000Z'),
      endDate: new Date('2099-08-12T23:59:59.999Z'),
    });
    jest.spyOn(ServiceModel, 'findById').mockResolvedValue(service as never);

    const result = await unblockServiceDates(
      serviceId.toString(),
      blockId.toString(),
      providerId.toString(),
    );

    expect(service.save).toHaveBeenCalledTimes(1);
    expect(result.blockedDateRanges).toEqual([]);
  });
});
