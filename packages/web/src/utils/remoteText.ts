interface RemoteTextParameters {
  allowShowingFirstLetters: boolean;
  allowShowingText: boolean;
  remoteTextUrl: string;
}

interface SimplifiedRemoteTextParameters {
  sfl: 1 | 0;
  st: 1 | 0;
  rUrl: string;
}

export function generateRemoteTextUrl({
  allowShowingFirstLetters,
  allowShowingText,
  remoteTextUrl,
}: RemoteTextParameters) {
  const data: SimplifiedRemoteTextParameters = {
    sfl: allowShowingFirstLetters ? 1 : 0,
    st: allowShowingText ? 1 : 0,
    rUrl: remoteTextUrl,
  };
  const base64Data = btoa(JSON.stringify(data));

  return `${window.location.origin}?text=${encodeURIComponent(base64Data)}`;
}

export function hasRemoteTextParametersInUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return !!urlParams.get('text');
}

export function parseRemoteTextParametersFromUrl(): RemoteTextParameters {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedParameters = urlParams.get('text');

  if (!encodedParameters) {
    throw new Error('Missing parameters in URL');
  }

  const parameters = JSON.parse(atob(decodeURIComponent(encodedParameters))) as SimplifiedRemoteTextParameters;

  return {
    allowShowingFirstLetters: Boolean(parameters.sfl),
    allowShowingText: Boolean(parameters.st),
    remoteTextUrl: parameters.rUrl,
  };
}

export async function loadRemoteText(url: string) {
  const headers = new Headers();

  headers.append('Cache-Control', 'no-cache');

  const response = await fetch(
    // A big thank you to https://github.com/Freeboard/thingproxy.
    // This is a just to fun project that is not going to be used intensively, so
    // the API should not be abused.
    `https://thingproxy.freeboard.io/fetch/${url}`,
    {
      method: 'GET',
      headers,
      mode: 'no-cors',
    },
  );

  const dataBlob = await response.blob();
  const data = await dataBlob.text();
  const matchedText = /<div class="plaintext\s?">((.|\n)*)<\/div>/gim.exec(data);
  const matchedTitle = /<title>((.|\n)*)<\/title>/gim.exec(data);
  const text = matchedText?.[1] || '';
  // Has format `Online Notepad - #title#`
  const rawTitle = matchedTitle?.[1] || '';
  const titleDashPosition = rawTitle.indexOf('-');
  const title = rawTitle.slice(
    titleDashPosition +
      // +1 (because index starts from 0), +1 (because of the space before title, check the format above)
      2,
  );
  const document = new DOMParser().parseFromString(text, 'text/html');
  // Unescape `&nbsp;, &#39;`, etc.
  const unescapedText = (document.documentElement.textContent || '').trim();

  if (!unescapedText) {
    throw new Error('Parsed text is empty');
  }

  return {
    text: unescapedText,
    title,
  };
}
