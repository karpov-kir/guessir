import { CreateTextDto } from '@guessir/shared/dist/CreateTextDto';
import { Text } from '@guessir/shared/dist/Text';
import urlJoin from 'url-join';

export async function createText(payload: CreateTextDto) {
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

    return (await response.json()) as Text;
  } catch (error) {
    throw new Error('Could not create text');
  }
}

// istanbul ignore next: nothing worth testing (no logic)
export function generateTextUrl(apiText: Text) {
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

  return (await response.json()) as Text;
}
