import { describe, expect, it } from 'vitest';

import { parseTextIdFromUrl } from './text';

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
