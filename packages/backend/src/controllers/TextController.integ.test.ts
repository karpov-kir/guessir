import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockRepository } from '../../tests/utils/mockRepository';
import { CreateTextDtoRequest } from '../dto/CreateTextDtoRequest';
import { TextEntity } from '../entities/TextEntity';
import { TextsController as TextController } from './TextController';

const text: TextEntity = {
  pk: 1,
  id: 'id',
  title: 'Title',
  description: 'Description',
  text: 'Text',
  allowShowingFirstLetters: true,
  allowShowingText: true,
  updatedAt: new Date(),
  createdAt: new Date(),
};
const { pk: _pk, ...serializedText } = text;

describe(TextController, () => {
  let textsController: TextController;
  let textsRepository: Repository<TextEntity>;

  beforeEach(() => {
    textsRepository = mockRepository<TextEntity>();
    textsController = new TextController(textsRepository);
  });

  describe('find', () => {
    it('should return an array of serialized texts', async () => {
      const result = [plainToInstance(TextEntity, text)];

      vi.spyOn(textsRepository, 'find').mockResolvedValue(result);

      expect(await textsController.find()).toEqual([serializedText]);
    });
  });

  describe('findById', () => {
    it('should find and return a sanitized text by id', async () => {
      vi.spyOn(textsRepository, 'findOne').mockResolvedValue(plainToInstance(TextEntity, text));

      expect(await textsController.findById('test')).toEqual(serializedText);
    });

    it('should return 404 exception if the text is not found', async () => {
      vi.spyOn(textsRepository, 'findOne').mockResolvedValue(null);

      await expect(textsController.findById('test')).rejects.toEqual(new NotFoundException());
    });

    it('should throw an error if the search query fails', async () => {
      vi.spyOn(textsRepository, 'findOne').mockRejectedValue(new Error('Test'));

      await expect(textsController.findById('test')).rejects.toEqual(new Error('Test'));
    });
  });

  describe('create', () => {
    it('should return a serialized text', async () => {
      vi.spyOn(textsRepository, 'save').mockResolvedValue(text);

      expect(await textsController.create({} as CreateTextDtoRequest)).toEqual(serializedText);
    });
  });
});
