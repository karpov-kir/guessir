import urlJoin from 'url-join';

interface ApiTextPayload {
  title: string;
  description?: string;
  text: string;
  allowShowingFirstLetters: boolean;
  allowShowingText: boolean;
}

interface ApiText {
  title: string;
  description?: string;
  text: string;
  allowShowingFirstLetters: boolean;
  allowShowingText: boolean;
  id: string;
  createdAt: string;
  updatedAt: string;
}

export async function createApiText(payload: ApiTextPayload) {
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

    return data as ApiText;
  } catch (error) {
    throw new Error('Could not create text');
  }
}

export function generateApiTextUrl(apiText: ApiText) {
  return `${window.location.origin}?textId=${apiText.id}`;
}

export function hasApiTextParametersInUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return !!urlParams.get('textId');
}

export function parseApiTextIdFromUrl(): string {
  const urlParams = new URLSearchParams(window.location.search);
  const textId = urlParams.get('textId');

  if (!textId) {
    throw new Error('Text ID is empty');
  }

  return textId;
}

export async function loadApiText(id: string) {
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

  return data as ApiText;
}
