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
    },
  );
  const dataBlob = await response.blob();
  const data = await dataBlob.text();
  const matchedText = /<div class="plaintext\s?">((.|\n)*)<\/div>/gim.exec(data);
  const text = matchedText?.[1] || '';
  const document = new DOMParser().parseFromString(text, 'text/html');
  // Unescape &nbsp;, &#39;, etc.
  const unescapedText = document.documentElement.textContent || '';

  return unescapedText;
}
