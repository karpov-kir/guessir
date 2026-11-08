import { Module } from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockRepository } from '../tests/utils/mockRepository.js';
import { TextsController } from './controllers/TextController.js';
import { TextEntity } from './entities/TextEntity.js';
import { newApp } from './newApp.js';

const text: TextEntity = {
  pk: 1,
  id: 'text-id',
  title: 'Title',
  text: 'One two',
  allowShowingFirstLetters: true,
  allowShowingText: true,
  updatedAt: new Date(),
  createdAt: new Date(),
};
const textsRepository: Repository<TextEntity> = mockRepository<TextEntity>();

@Module({
  controllers: [TextsController],
  providers: [{ provide: getRepositoryToken(TextEntity), useValue: textsRepository }],
})
class TestModule {}

describe('the texts API over HTTP', () => {
  let app: NestFastifyApplication;
  const request = (method: 'GET' | 'HEAD' | 'POST', url: string, payload?: object) =>
    app.getHttpAdapter().getInstance().inject({ method, url, payload });

  beforeAll(async () => {
    app = await newApp(TestModule, { logger: false });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(() => app.close());

  beforeEach(() => {
    vi.spyOn(textsRepository, 'findOne').mockResolvedValue(text);
    vi.spyOn(textsRepository, 'save').mockResolvedValue(text);
  });

  it('should create a text and answer only its id', async () => {
    const response = await request('POST', '/texts', {
      title: 'Title',
      text: 'One two',
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ id: 'text-id' });
  });

  it('should send the security headers and allow the web origin', async () => {
    const response = await app
      .getHttpAdapter()
      .getInstance()
      .inject({ method: 'GET', url: '/texts/text-id', headers: { origin: 'https://guessir.kk-forge.com' } });

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['access-control-allow-origin']).toBe('https://guessir.kk-forge.com');
  });

  it('should not list texts', async () => {
    expect((await request('GET', '/texts')).statusCode).toBe(404);
  });

  it('should not answer HEAD, which no route limit covers', async () => {
    expect((await request('HEAD', '/texts/text-id')).statusCode).toBe(404);
  });

  it('should play a text through the routes the web client calls', async () => {
    const skeleton = await request('GET', '/texts/text-id');
    const guess = await request('POST', '/texts/text-id/guesses', { word: 'one' });
    const reveal = await request('POST', '/texts/text-id/reveals', { index: 2 });
    const firstLetters = await request('GET', '/texts/text-id/first-letters');
    const words = await request('GET', '/texts/text-id/words');

    expect(skeleton.json()).toMatchObject({
      lexemes: [
        { index: 0, length: 3 },
        { index: 1, character: ' ' },
        { index: 2, length: 3 },
      ],
    });
    expect(skeleton.body).not.toMatch(/one|two/i);
    expect([guess.statusCode, reveal.statusCode, firstLetters.statusCode, words.statusCode]).toEqual([
      200, 200, 200, 200,
    ]);
    expect(guess.json()).toEqual({ words: [{ index: 0, word: 'One' }] });
    expect(reveal.json()).toEqual({ index: 2, word: 'two' });
    expect(firstLetters.json()).toEqual({
      words: [
        { index: 0, word: 'O' },
        { index: 2, word: 't' },
      ],
    });
    expect(words.json()).toEqual({
      words: [
        { index: 0, word: 'One' },
        { index: 2, word: 'two' },
      ],
    });
  });

  it.each([
    { route: 'guesses', payload: { word: '' } },
    { route: 'guesses', payload: { word: 'one', index: 0 } },
    { route: 'reveals', payload: { index: '0' } },
    { route: 'reveals', payload: { index: -1 } },
  ])('should reject the $route body $payload', async ({ route, payload }) => {
    const response = await request('POST', `/texts/text-id/${route}`, payload);

    expect(response.statusCode).toBe(400);
  });
});
