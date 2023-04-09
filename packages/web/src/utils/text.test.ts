import { TextInterface } from '@guessir/shared/dist/TextInterface';

import { createText, loadText, parseTextIdFromUrl } from './text';

let mockedFetch: jest.Mock;
const mockedText = {
  id: 'test-id',
} as TextInterface;

beforeEach(() => {
  mockedFetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockedText),
  }) as jest.Mock;
  window.fetch = mockedFetch;
});

describe(createText, () => {
  it('should create a text', async () => {
    await expect(createText(mockedText)).resolves.toEqual(mockedText);
  });

  it('should throw a default error if the query fails', async () => {
    mockedFetch.mockResolvedValue({
      ok: false,
    });

    await expect(createText(mockedText)).rejects.toEqual(new Error('Could not create text'));
  });
});

describe(parseTextIdFromUrl, () => {
  Object.defineProperty(window, 'location', {
    value: {
      search: '',
    },
  });

  it('should parse a text ID from the URL', () => {
    window.location.search = '?textId=1';
    expect(parseTextIdFromUrl()).toEqual('1');
  });

  it('should throw an error if the text ID is not found in the URL', () => {
    window.location.search = '?textId=';
    expect(() => parseTextIdFromUrl()).toThrow(new Error('Text ID is empty'));
  });
});

describe(loadText, () => {
  it('should load a text', async () => {
    await expect(loadText('text-id')).resolves.toEqual(mockedText);
  });

  it('should throw a default error if the query fails', async () => {
    mockedFetch.mockResolvedValue({
      ok: false,
    });

    await expect(loadText('text-id')).rejects.toEqual(new Error('Could not load text'));
  });
});
