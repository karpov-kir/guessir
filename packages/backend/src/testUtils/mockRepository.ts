import { Repository } from 'typeorm';

export const mockRepository = <T>(): Repository<T> => {
  return {
    find: jest.fn() as Repository<T>['find'],
    findOne: jest.fn() as Repository<T>['findOne'],
    save: jest.fn() as Repository<T>['save'],
  } as Repository<T>;
};
