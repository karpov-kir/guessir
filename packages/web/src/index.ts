import './styles.css';

import { LexemeBuilder } from './lexemeBuilder';
import { RenderManager } from './renderers';
import { hasTextParametersInUrl, loadText, parseTextIdFromUrl } from './utils';

const defaultTitle = 'Hello!';

const defaultDescription = `I am a simple tool to turn any English text into a word guessing game.`;

const defaultText = `In order to create your own text check the instructions below.`;

const couldNotLoadRemoteTextText = `
  I could not load the remote text. Please, verify your URL or create a new text.
`;

async function boot() {
  let text = defaultText;
  let title = defaultTitle;
  let description: string | undefined = defaultDescription;
  let allowShowingText = true;
  let allowShowingFirstLetters = true;

  if (hasTextParametersInUrl()) {
    try {
      console.log('Trying to load API text');

      const id = parseTextIdFromUrl();
      const apiText = await loadText(id);

      console.log('API text has been loaded', apiText);

      ({ text, title, allowShowingText, allowShowingFirstLetters, description } = apiText);
    } catch (error) {
      console.log('API text has been failed to load', error);
      console.error(error);
      text = couldNotLoadRemoteTextText;
    }
  }

  const lexemeAnalysis = new LexemeBuilder().buildLexemes(text);
  const renderManager = new RenderManager(
    lexemeAnalysis,
    title,
    description,
    allowShowingText,
    allowShowingFirstLetters,
  );

  renderManager.init(document.body);
}

boot();
