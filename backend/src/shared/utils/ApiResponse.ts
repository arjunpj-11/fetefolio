import type { IApiResponse } from '@programme/contracts';

export class ApiResponse<T> implements IApiResponse<T> {
  readonly success = true;
  constructor(
    public readonly data: T,
    public readonly message = 'Success',
  ) {}
}
