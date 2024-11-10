import { ObjectLiteral, Repository } from 'typeorm';
import { vi } from 'vitest';

export const mockRepository = <T extends ObjectLiteral>(): Repository<T> => {
  return {
    find: vi.fn() as Repository<T>['find'],
    findOne: vi.fn() as Repository<T>['findOne'],
    save: vi.fn() as Repository<T>['save'],
  } as Repository<T>;
};
