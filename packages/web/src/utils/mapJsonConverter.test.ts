import { describe, expect, it } from 'vitest';

import { mapFromJsonReviver, mapToJsonReplacer } from './mapJsonConverter';

describe(mapToJsonReplacer, () => {
  it('should convert a map to JSON', () => {
    expect(
      mapToJsonReplacer(
        'test',
        new Map<number, number>([
          [1, 1],
          [2, 2],
        ]),
      ),
    ).toEqual({
      convertedMap: [
        [1, 1],
        [2, 2],
      ],
      dataType: 'Map',
    });
  });

  it('should not convert not a map', () => {
    expect(
      mapToJsonReplacer('test', {
        key: 'value',
      }),
    ).toEqual({
      key: 'value',
    });
  });
});

describe(mapFromJsonReviver, () => {
  it('should convert a map from JSON', () => {
    expect(
      mapFromJsonReviver('test', {
        convertedMap: [
          [1, 1],
          [2, 2],
        ],
        dataType: 'Map',
      }),
    ).toEqual(
      new Map<number, number>([
        [1, 1],
        [2, 2],
      ]),
    );
  });

  it('should not convert not a map', () => {
    expect(
      mapFromJsonReviver('test', {
        key: 'value',
      }),
    ).toEqual({
      key: 'value',
    });
  });
});
