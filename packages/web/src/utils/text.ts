import { CreateTextDtoResponse } from '@guessir/shared/dist/CreateTextDtoResponse';

// v8 ignore next: nothing worth testing (no logic)
export function generateTextUrl(apiText: CreateTextDtoResponse) {
  return `${window.location.origin}?textId=${apiText.id}`;
}

// v8 ignore next: nothing worth testing
export function hasTextParametersInUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return !!urlParams.get('textId');
}

export function parseTextIdFromUrl(): string {
  const urlParams = new URLSearchParams(window.location.search);
  const textId = urlParams.get('textId');

  if (!textId) {
    throw new Error('Text ID is empty');
  }

  return textId;
}
