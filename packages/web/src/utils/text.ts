import { CreateTextDtoInterface, TextInterface } from '@guessir/shared';
import urlJoin from 'url-join';

export async function createText(payload: CreateTextDtoInterface) {
  try {
    const response = await fetch(urlJoin(process.env.GUESSIR_API_BASE_URL || '', `texts`), {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    const data = await response.json();

    if (!data) {
      throw new Error('Could not parse response');
    }

    return data as TextInterface;
  } catch (error) {
    throw new Error('Could not create text');
  }
}

export function generateTextUrl(apiText: TextInterface) {
  return `${window.location.origin}?textId=${apiText.id}`;
}

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
  const response = await fetch(urlJoin(process.env.GUESSIR_API_BASE_URL || '', `texts/${id}`), {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Could not load text');
  }

  const data = await response.json();

  if (!data) {
    throw new Error('Could not parse response');
  }

  return data as TextInterface;
}
