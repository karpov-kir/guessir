import { ForbiddenException, NotFoundException } from '@nestjs/common';
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
  text: 'One, two one',
  allowShowingFirstLetters: true,
  allowShowingText: true,
  updatedAt: new Date(),
  createdAt: new Date(),
};

describe(TextController, () => {
  let textsController: TextController;
  let textsRepository: Repository<TextEntity>;

  /** Makes the repository return `text` with `overrides` for any id. */
  const storeText = (overrides: Partial<TextEntity> = {}) => {
    vi.spyOn(textsRepository, 'findOne').mockResolvedValue({ ...text, ...overrides });
  };

  beforeEach(() => {
    textsRepository = mockRepository<TextEntity>();
    textsController = new TextController(textsRepository);
  });

  describe('create', () => {
    it('should return only the id of the new text', async () => {
      vi.spyOn(textsRepository, 'save').mockResolvedValue(text);

      expect(await textsController.create({} as CreateTextDtoRequest)).toEqual({ id: 'id' });
    });
  });

  describe('findById', () => {
    it('should return the skeleton of the text without its letters', async () => {
      storeText();

      expect(await textsController.findById('id')).toEqual({
        title: 'Title',
        description: 'Description',
        allowShowingFirstLetters: true,
        allowShowingText: true,
        wordCount: 3,
        lexemes: [
          { index: 0, length: 3 },
          { index: 1, character: ',' },
          { index: 2, character: ' ' },
          { index: 3, length: 3 },
          { index: 4, character: ' ' },
          { index: 5, length: 3 },
        ],
      });
      expect(textsRepository.findOne).toBeCalledWith({ where: { id: 'id' } });
    });

    it('should throw an error if the search query fails', async () => {
      vi.spyOn(textsRepository, 'findOne').mockRejectedValue(new Error('Test'));

      await expect(textsController.findById('id')).rejects.toEqual(new Error('Test'));
    });
  });

  describe('guess', () => {
    it('should return every word the guess opens', async () => {
      storeText();

      expect(await textsController.guess('id', { word: 'ONE' })).toEqual({
        words: [
          { index: 0, word: 'One' },
          { index: 5, word: 'one' },
        ],
      });
    });

    it('should return no words for a miss', async () => {
      storeText();

      expect(await textsController.guess('id', { word: 'three' })).toEqual({ words: [] });
    });
  });

  describe('reveal', () => {
    it('should return the word at the index', async () => {
      storeText();

      expect(await textsController.reveal('id', { index: 3 })).toEqual({ index: 3, word: 'two' });
    });

    it.each([1, 6])('should return 404 for the index %i, which holds no word', async (index) => {
      storeText();

      await expect(textsController.reveal('id', { index })).rejects.toEqual(new NotFoundException());
    });
  });

  describe('firstLetters', () => {
    it('should return the first letter of every word', async () => {
      storeText();

      expect(await textsController.firstLetters('id')).toEqual({
        words: [
          { index: 0, word: 'O' },
          { index: 3, word: 't' },
          { index: 5, word: 'o' },
        ],
      });
    });

    it('should return 403 when the text does not allow showing first letters', async () => {
      storeText({ allowShowingFirstLetters: false });

      await expect(textsController.firstLetters('id')).rejects.toEqual(new ForbiddenException());
    });
  });

  describe('words', () => {
    it('should return every word', async () => {
      storeText();

      expect(await textsController.words('id')).toEqual({
        words: [
          { index: 0, word: 'One' },
          { index: 3, word: 'two' },
          { index: 5, word: 'one' },
        ],
      });
    });

    it('should return 403 when the text does not allow showing it', async () => {
      storeText({ allowShowingText: false });

      await expect(textsController.words('id')).rejects.toEqual(new ForbiddenException());
    });
  });

  describe('cache', () => {
    it('should ask the repository once for repeated requests on one text', async () => {
      storeText();

      await textsController.findById('id');
      await textsController.guess('id', { word: 'one' });
      await textsController.words('id');

      expect(textsRepository.findOne).toBeCalledTimes(1);
    });

    it('should ask the repository again for an unknown text', async () => {
      vi.spyOn(textsRepository, 'findOne').mockResolvedValue(null);

      await expect(textsController.findById('unknown')).rejects.toEqual(new NotFoundException());
      await expect(textsController.findById('unknown')).rejects.toEqual(new NotFoundException());

      expect(textsRepository.findOne).toBeCalledTimes(2);
    });

    it('should ask the repository again for a text it dropped beyond its bound', async () => {
      storeText();

      for (let i = 0; i <= TextController.CACHED_TEXT_COUNT; i++) {
        await textsController.findById(`id-${i}`);
      }

      await textsController.findById('id-0');

      expect(textsRepository.findOne).toBeCalledTimes(TextController.CACHED_TEXT_COUNT + 2);
      expect(textsRepository.findOne).lastCalledWith({ where: { id: 'id-0' } });
    });
  });

  describe.each([
    { route: 'findById', call: () => textsController.findById('unknown') },
    { route: 'guess', call: () => textsController.guess('unknown', { word: 'one' }) },
    { route: 'reveal', call: () => textsController.reveal('unknown', { index: 0 }) },
    { route: 'firstLetters', call: () => textsController.firstLetters('unknown') },
    { route: 'words', call: () => textsController.words('unknown') },
  ])('$route', ({ call }) => {
    it('should return 404 if the text is not found', async () => {
      vi.spyOn(textsRepository, 'findOne').mockResolvedValue(null);

      await expect(call()).rejects.toEqual(new NotFoundException());
    });
  });
});
