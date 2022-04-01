type ConvertedMap = {
  dataType: 'Map';
  convertedMap: Array<[unknown, unknown]>;
};

// JSON.stringify(originalValue, mapToJsonReplacer);
// JSON.parse(json, mapFromJsonReviver);

export function mapToJsonReplacer(key: string, value: unknown) {
  if (value instanceof Map) {
    const convertedMap: ConvertedMap = {
      dataType: 'Map',
      convertedMap: Array.from(value.entries()),
    };
    return convertedMap;
  } else {
    return value;
  }
}

export function mapFromJsonReviver(key: string, value: unknown) {
  if (isConvertedMap(value)) {
    return new Map(value.convertedMap);
  }

  return value;
}

function isConvertedMap(value: any): value is ConvertedMap {
  return value?.convertedMap === 'Map';
}
