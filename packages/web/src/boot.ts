import './styles.css';

import { LexemeAnalyzer } from './lexemeAnalyzer/LexemeAnalyzer';
import { RenderController } from './renderers/RenderController';
import { hasTextParametersInUrl, loadText, parseTextIdFromUrl } from './utils/text';

const defaultTitle = 'Hello!';

const defaultDescription = `I am a simple tool to turn any English text into a word guessing game.`;

const defaultText = `In order to create your own text find the form below.`;

const couldNotLoadRemoteTextText = `
  I could not load the remote text. Please, verify your URL or create a new text.
`;

export async function boot(containerElement: HTMLElement) {
  let text = defaultText;
  let title = defaultTitle;
  let description: string | undefined = defaultDescription;
  let allowShowingText = true;
  let allowShowingFirstLetters = true;

  if (hasTextParametersInUrl()) {
    try {
      console.log('Trying to load text...');

      const id = parseTextIdFromUrl();
      const apiText = await loadText(id);

      console.log('Text has been loaded', apiText);

      ({ text, title, allowShowingText, allowShowingFirstLetters, description } = apiText);
    } catch (error) {
      console.log('Text has been failed to load', error);
      console.error(error);
      text = couldNotLoadRemoteTextText;
    }
  }

  const lexemesAnalysis = LexemeAnalyzer.analyze(text);
  const renderController = new RenderController({
    lexemesAnalysis,
    title,
    description,
    allowShowingText,
    allowShowingFirstLetters,
  });

  renderController.init(containerElement);
}
