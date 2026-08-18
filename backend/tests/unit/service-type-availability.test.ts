import { ServiceModel } from '../../src/modules/services/service.model.js';
import { ServiceTypeModel } from '../../src/modules/services/service-type.model.js';
import { listServiceTypes } from '../../src/modules/services/service-type.service.js';

describe('available service types', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns only types with an active service available for the selected dates', async () => {
    const types = [
      {
        _id: '507f1f77bcf86cd799439011',
        slug: 'venue',
        label: 'Venues',
        singular: 'venue',
        description: 'Spaces',
        dateLabel: 'Event dates',
        createdAt: new Date(),
      },
      {
        _id: '507f1f77bcf86cd799439012',
        slug: 'florists',
        label: 'Florists',
        singular: 'florist',
        description: 'Flowers',
        dateLabel: 'Event dates',
        createdAt: new Date(),
      },
    ];
    jest
      .spyOn(ServiceTypeModel, 'find')
      .mockReturnValue({ sort: jest.fn().mockResolvedValue(types) } as never);
    jest.spyOn(ServiceModel, 'aggregate').mockResolvedValue([
      { _id: 'venue', count: 2 },
      { _id: 'florists', count: 1 },
    ] as never);
    jest.spyOn(ServiceModel, 'distinct').mockResolvedValue(['venue'] as never);

    const result = await listServiceTypes({
      availableOnly: true,
      startDate: '2026-12-10',
      endDate: '2026-12-10',
    });

    expect(result.map((type) => type.slug)).toEqual(['venue']);
    expect(result[0]?.serviceCount).toBe(2);
    expect(ServiceModel.distinct).toHaveBeenCalledWith(
      'category',
      expect.objectContaining({ isActive: true }),
    );
  });
});
