import { ServiceTypeModel } from '../../src/modules/services/service-type.model.js';
import {
  createServiceType,
  deleteServiceType,
  updateServiceType,
} from '../../src/modules/services/service-type.service.js';
import { ServiceModel } from '../../src/modules/services/service.model.js';
import { assertUniqueServiceTitle } from '../../src/modules/services/service.service.js';
import { BookingModel } from '../../src/modules/bookings/booking.model.js';

describe('service uniqueness', () => {
  afterEach(() => jest.restoreAllMocks());

  it('rejects a service name that already exists regardless of case', async () => {
    jest
      .spyOn(ServiceModel, 'exists')
      .mockResolvedValue({ _id: '507f1f77bcf86cd799439011' } as never);
    await expect(assertUniqueServiceTitle('Marigold Courtyard')).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining('Service names must be unique'),
    });
  });

  it('returns a specific error when a service type already exists', async () => {
    jest
      .spyOn(ServiceTypeModel, 'exists')
      .mockResolvedValue({ _id: '507f1f77bcf86cd799439012' } as never);
    await expect(createServiceType({ name: 'Venues' })).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining('already exists'),
    });
  });

  it('gives every newly created service type the generic symbol', async () => {
    const created = {
      _id: '507f1f77bcf86cd799439011',
      slug: 'makeup',
      label: 'Makeup',
      normalizedName: 'makeup',
      singular: 'makeup',
      description: 'Makeup available for events and celebrations',
      capacityLabel: 'Guest capacity',
      dateLabel: 'Event dates',
      icon: 'sparkles',
      createdAt: new Date(),
    };
    jest.spyOn(ServiceTypeModel, 'exists').mockResolvedValue(null);
    const create = jest.spyOn(ServiceTypeModel, 'create').mockResolvedValue(created as never);

    const result = await createServiceType({ name: 'Makeup' });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ icon: 'sparkles' }));
    expect(result.icon).toBe('sparkles');
  });

  it('rejects a spelling update that duplicates another service type', async () => {
    jest
      .spyOn(ServiceTypeModel, 'findById')
      .mockResolvedValue({ _id: '507f1f77bcf86cd799439011', label: 'Flowers' } as never);
    jest
      .spyOn(ServiceTypeModel, 'exists')
      .mockResolvedValue({ _id: '507f1f77bcf86cd799439012' } as never);
    await expect(
      updateServiceType('507f1f77bcf86cd799439011', { name: 'Venues' }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining('already exists'),
    });
  });

  it('updates a service-type symbol without changing its slug', async () => {
    const type = {
      _id: '507f1f77bcf86cd799439011',
      slug: 'venue',
      label: 'Venues',
      normalizedName: 'venues',
      singular: 'venue',
      description: 'Event spaces',
      dateLabel: 'Event dates',
      icon: 'sparkles',
      createdAt: new Date(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    jest.spyOn(ServiceTypeModel, 'findById').mockResolvedValue(type as never);
    jest.spyOn(ServiceModel, 'countDocuments').mockResolvedValue(2);

    const result = await updateServiceType('507f1f77bcf86cd799439011', { icon: 'music' });

    expect(type.icon).toBe('music');
    expect(result).toMatchObject({ slug: 'venue', icon: 'music' });
  });

  it('requires cascade confirmation before removing a populated service type', async () => {
    jest
      .spyOn(ServiceTypeModel, 'findById')
      .mockResolvedValue({ _id: '507f1f77bcf86cd799439011', slug: 'florists' } as never);
    jest.spyOn(ServiceModel, 'find').mockReturnValue({
      distinct: jest.fn().mockResolvedValue(['507f1f77bcf86cd799439012']),
    } as never);
    await expect(deleteServiceType('507f1f77bcf86cd799439011', false)).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining('Confirm removal'),
    });
  });

  it('blocks service-type cascade deletion when a contained service has an upcoming booking', async () => {
    jest
      .spyOn(ServiceTypeModel, 'findById')
      .mockResolvedValue({ _id: '507f1f77bcf86cd799439011', slug: 'venue' } as never);
    jest.spyOn(ServiceModel, 'find').mockReturnValue({
      distinct: jest.fn().mockResolvedValue(['507f1f77bcf86cd799439012']),
    } as never);
    jest
      .spyOn(BookingModel, 'exists')
      .mockResolvedValue({ _id: '507f1f77bcf86cd799439013' } as never);
    const deleteServices = jest.spyOn(ServiceModel, 'deleteMany');

    await expect(deleteServiceType('507f1f77bcf86cd799439011', true)).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining('pending or confirmed upcoming bookings'),
    });
    expect(deleteServices).not.toHaveBeenCalled();
  });
});
