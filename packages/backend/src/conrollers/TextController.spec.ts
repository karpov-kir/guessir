import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';

import { CreateTextDto } from '../dto';
import { Text } from '../entities';
import { mockRepository } from '../textUtils/mockRepository';
import { TextsController } from './TextsController';

const text: Text = {
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

describe(TextsController, () => {
  let textsController: TextsController;
  let textsRepository: Repository<Text>;

  beforeEach(() => {
    textsRepository = mockRepository<Text>();
    textsController = new TextsController(textsRepository);
  });

  describe('find', () => {
    it('should return an array of serialized texts', async () => {
      const result = [plainToInstance(Text, text)];

      jest.spyOn(textsRepository, 'find').mockResolvedValue(result);

      expect(await textsController.find()).toEqual([serializedText]);
    });
  });

  describe('findById', () => {
    it('should find and return a sanitized text by id', async () => {
      jest.spyOn(textsRepository, 'findOne').mockResolvedValue(plainToInstance(Text, text));

      expect(await textsController.findById('test')).toEqual(serializedText);
    });

    it('should return 404 exception if the text is not found', async () => {
      jest.spyOn(textsRepository, 'findOne').mockResolvedValue(undefined);

      await expect(textsController.findById('test')).rejects.toEqual(new NotFoundException());
    });

    it('should throw an error if the search query fails', async () => {
      jest.spyOn(textsRepository, 'findOne').mockRejectedValue(new Error('Test'));

      await expect(textsController.findById('test')).rejects.toEqual(new Error('Test'));
    });
  });

  describe('create', () => {
    it('should return a serialized text', async () => {
      jest.spyOn(textsRepository, 'save').mockResolvedValue(text);

      expect(await textsController.create({} as CreateTextDto)).toEqual(serializedText);
    });
  });
});
