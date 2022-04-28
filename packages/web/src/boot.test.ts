import { TextInterface } from '@guessir/shared';

import { boot } from './boot';
import { LexemeAnalyzer } from './lexemeAnalyzer';
import { RenderController } from './renderers';

const mockedText = {
  id: 'text-id',
  title: 'Test title',
  text: 'Test text',
  description: 'Test description',
  allowShowingFirstLetters: true,
  allowShowingText: true,
} as TextInterface;
const mockedLoadText = jest.fn();

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  loadText: (...args: unknown[]) => mockedLoadText(...args),
}));

jest.mock('./renderers');

Object.defineProperty(window, 'location', {
  value: {
    search: `?textId=${mockedText.id}`,
  },
});

describe(boot, () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(LexemeAnalyzer.prototype, 'analyze');
  });

  it('should load and render a remote text', async () => {
    mockedLoadText.mockResolvedValue(mockedText);

    await boot(document.createElement('div'));

    expect(mockedLoadText).toBeCalledWith(mockedText.id);
    expect(LexemeAnalyzer.prototype.analyze).toBeCalledWith(mockedText.text);

    expect(RenderController).toBeCalledWith({
      lexemesAnalysis: expect.any(Object),
      title: mockedText.title,
      description: mockedText.description,
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });
  });

  it('should render an error text if loading a remote text fails', async () => {
    mockedLoadText.mockRejectedValue(new Error('Test'));

    await boot(document.createElement('div'));

    expect(LexemeAnalyzer.prototype.analyze).toBeCalledWith(
      expect.stringContaining(`I could not load the remote text. Please, verify your URL or create a new text.`),
    );
    expect(RenderController).toBeCalledWith({
      lexemesAnalysis: expect.any(Object),
      title: 'Hello!',
      description: 'I am a simple tool to turn any English text into a word guessing game.',
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });
  });

  it('should render a default text if a text ID is not set in the URL', async () => {
    window.location.search = '';

    await boot(document.createElement('div'));

    expect(LexemeAnalyzer.prototype.analyze).toBeCalledWith('In order to create your own text find the form below.');
    expect(RenderController).toBeCalledWith({
      lexemesAnalysis: expect.any(Object),
      title: 'Hello!',
      description: 'I am a simple tool to turn any English text into a word guessing game.',
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });
  });
});
