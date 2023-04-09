import { CreateTextDtoInterface } from '@guessir/shared/dist/CreateTextDtoInterface';
import { TextInterface } from '@guessir/shared/dist/TextInterface';
import urlJoin from 'url-join';

export async function createText(payload: CreateTextDtoInterface) {
  try {
    const response = await fetch(urlJoin(import.meta.env.GUESSIR_API_BASE_URL, `texts`), {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    return (await response.json()) as TextInterface;
  } catch (error) {
    throw new Error('Could not create text');
  }
}

// istanbul ignore next: nothing worth testing (no logic)
export function generateTextUrl(apiText: TextInterface) {
  return `${window.location.origin}?textId=${apiText.id}`;
}

// istanbul ignore next: nothing worth testing
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

export async function loadText(id: string) {
  const response = await fetch(urlJoin(import.meta.env.GUESSIR_API_BASE_URL, `texts/${id}`), {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Could not load text');
  }

  return (await response.json()) as TextInterface;
}
