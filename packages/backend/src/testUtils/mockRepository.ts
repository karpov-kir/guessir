import { ObjectLiteral, Repository } from 'typeorm';

export const mockRepository = <T extends ObjectLiteral>(): Repository<T> => {
  return {
    find: jest.fn() as Repository<T>['find'],
    findOne: jest.fn() as Repository<T>['findOne'],
    save: jest.fn() as Repository<T>['save'],
  } as Repository<T>;
};
