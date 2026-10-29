import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LocalGame } from './game/LocalGame';
import { PubSub } from './pubSub/PubSub';
import { RenderController } from './RenderController';
import { ControlsRenderer, GuessEvent } from './renderers/ControlsRenderer';
import { ScoreRenderer } from './renderers/ScoreRenderer';
import { TextRenderer } from './renderers/textRenderer/TextRenderer';

let game: LocalGame;
let containerElement: HTMLElement;
let scoreRenderer: ScoreRenderer;

let controlsRenderer: ControlsRenderer;
let guessPubSub: PubSub<GuessEvent>;
let showFirstLettersPubSub: PubSub<boolean>;
let showTextPubSub: PubSub<boolean>;

let textRenderer: TextRenderer;
let revealRequestPubSub: PubSub<number>;

/** Lets the game answers, which are promises, reach the renderers. */
const settle = () => new Promise((resolve) => setTimeout(resolve));
const getStatus = () => containerElement.querySelector('#guess-status')?.textContent;
const getGuessInput = () => containerElement.querySelector('#guess-input') as HTMLInputElement;
const typeGuess = (word: string) => {
  getGuessInput().value = word;
  getGuessInput().dispatchEvent(new Event('input'));
};
const submitGuess = (word: string) => {
  typeGuess(word);
  (containerElement.querySelector('#guess-button') as HTMLButtonElement).click();
};
const getTextClasses = () => textRenderer.getElement().classList;
const getWordTexts = () =>
  Array.from(textRenderer.getElement().querySelectorAll('.lexeme')).map((element) => element.textContent);

describe(RenderController, () => {
  beforeEach(() => {
    game = new LocalGame({
      title: 'Title',
      text: 'One two',
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });

    guessPubSub = new PubSub<GuessEvent>();
    showFirstLettersPubSub = new PubSub<boolean>();
    showTextPubSub = new PubSub<boolean>();
    controlsRenderer = new ControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: true,
      guessPubSub,
      showFirstLettersPubSub,
      showTextPubSub,
    });

    scoreRenderer = new ScoreRenderer({ wordLikeCount: game.skeleton.wordCount });

    revealRequestPubSub = new PubSub<number>();
    textRenderer = new TextRenderer({ lexemes: game.skeleton.lexemes, revealRequestPubSub });

    containerElement = document.createElement('div');
    new RenderController({ game, textRenderer, scoreRenderer, controlsRenderer }).init(containerElement);

    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(scoreRenderer, 'addScore');
    vi.spyOn(controlsRenderer, 'returnGuess');
    vi.spyOn(controlsRenderer, 'shakeAndError');
  });

  it('should render the skeleton of the game', () => {
    const renderedContainerElement = document.createElement('div');

    new RenderController({ game }).init(renderedContainerElement);

    expect(renderedContainerElement.querySelector('#title')?.textContent).toBe('Title');
    expect(renderedContainerElement.querySelectorAll('.lexeme-container')).toHaveLength(2);
    expect(renderedContainerElement.querySelector('#total-score')?.textContent).toBe('2');
  });

  it('should put the score and the controls together above the text', () => {
    const hudElement = containerElement.querySelector('#hud') as HTMLElement;

    expect(hudElement.contains(scoreRenderer.getElement())).toBe(true);
    expect(hudElement.contains(controlsRenderer.getElement())).toBe(true);
    expect(hudElement.nextElementSibling).toBe(textRenderer.getElement());
  });

  it('should reveal a clicked word and increase the score once', async () => {
    vi.spyOn(game, 'reveal');

    revealRequestPubSub.publish(0);
    revealRequestPubSub.publish(0);
    await settle();

    expect(game.reveal).toBeCalledWith(0);
    expect(getWordTexts()[0]).toBe('One');
    expect(scoreRenderer.addScore).toBeCalledTimes(1);
    expect(scoreRenderer.addScore).toBeCalledWith(1);
  });

  it('should announce a word that could not be revealed', async () => {
    vi.spyOn(game, 'reveal').mockRejectedValue(new Error('Test'));

    revealRequestPubSub.publish(0);
    await settle();

    expect(getStatus()).toBe('Could not open this word');
    expect(scoreRenderer.addScore).not.toBeCalled();
  });

  it('should increase the score if the user guesses a word', async () => {
    guessPubSub.publish({ word: 'one' });
    await settle();

    expect(getWordTexts()[0]).toBe('One');
    expect(scoreRenderer.addScore).toBeCalledWith(1);
    expect(controlsRenderer.returnGuess).not.toBeCalled();
  });

  it('should shake the guess input and keep the score when the user does not guess the word', async () => {
    guessPubSub.publish({ word: 'unknown' });
    await settle();

    expect(scoreRenderer.addScore).toBeCalledWith(0);
    expect(controlsRenderer.shakeAndError).toBeCalled();
    expect(controlsRenderer.returnGuess).toBeCalledWith('unknown');
  });

  it('should announce a guess that could not be checked, without counting it as a miss', async () => {
    vi.spyOn(game, 'guess').mockRejectedValue(new Error('Test'));

    guessPubSub.publish({ word: 'one' });
    await settle();

    expect(getStatus()).toBe('Could not check this guess');
    expect(controlsRenderer.shakeAndError).not.toBeCalled();
    expect(controlsRenderer.returnGuess).toBeCalledWith('one');
    expect(scoreRenderer.addScore).not.toBeCalled();
  });

  it.each([
    { outcome: 'a miss', word: 'unknown', mockGuess: () => undefined },
    {
      outcome: 'a failure',
      word: 'one',
      mockGuess: () => vi.spyOn(game, 'guess').mockRejectedValue(new Error('Test')),
    },
  ])('should hand the guess back into the empty input after $outcome', async ({ word, mockGuess }) => {
    mockGuess();

    submitGuess(word);
    expect(getGuessInput().value).toBe('');
    await settle();

    expect(getGuessInput().value).toBe(word);
  });

  it.each([
    { outcome: 'a hit', word: 'one', mockGuess: () => undefined },
    { outcome: 'a miss', word: 'unknown', mockGuess: () => undefined },
    {
      outcome: 'a failure',
      word: 'one',
      mockGuess: () => vi.spyOn(game, 'guess').mockRejectedValue(new Error('Test')),
    },
  ])(
    'should keep the word the player typed while the guess was checked, after $outcome',
    async ({ word, mockGuess }) => {
      mockGuess();

      submitGuess(word);
      typeGuess('two');
      await settle();

      expect(getGuessInput().value).toBe('two');
    },
  );

  it('should keep a status announced while a hit was checked', async () => {
    submitGuess('one');
    controlsRenderer.announce('Could not open this word');
    await settle();

    expect(getStatus()).toBe('Could not open this word');
  });

  it('should load the first letters once and show them', async () => {
    vi.spyOn(game, 'firstLetters');

    showFirstLettersPubSub.publish(true);
    await settle();

    expect(getTextClasses()).toContain('show-first-letters');
    expect(textRenderer.getElement().querySelector('.lexeme-first-letter')?.textContent).toBe('O');

    showFirstLettersPubSub.publish(false);
    expect(getTextClasses()).not.toContain('show-first-letters');

    showFirstLettersPubSub.publish(true);
    await settle();

    expect(getTextClasses()).toContain('show-first-letters');
    expect(game.firstLetters).toBeCalledTimes(1);
    expect(scoreRenderer.addScore).not.toBeCalled();
  });

  it('should load the words once and let the user peek at them', async () => {
    vi.spyOn(game, 'words');

    showTextPubSub.publish(true);
    await settle();

    expect(getTextClasses()).toContain('show-text');
    expect(getWordTexts()).toEqual(['One', 'two']);

    showTextPubSub.publish(false);
    expect(getTextClasses()).not.toContain('show-text');

    showTextPubSub.publish(true);
    await settle();

    expect(game.words).toBeCalledTimes(1);
    expect(scoreRenderer.addScore).not.toBeCalled();
  });

  it.each([
    { hint: 'first letters', load: 'firstLetters', status: 'Could not load the first letters' },
    { hint: 'text', load: 'words', status: 'Could not load the text' },
  ] as const)('should uncheck $hint and announce it when they fail to load', async ({ load, status }) => {
    const pubSub = load === 'firstLetters' ? showFirstLettersPubSub : showTextPubSub;
    const uncheck = load === 'firstLetters' ? 'uncheckFirstLetters' : 'uncheckText';

    vi.spyOn(game, load).mockRejectedValueOnce(new Error('Test'));
    vi.spyOn(controlsRenderer, uncheck);

    pubSub.publish(true);
    await settle();

    expect(controlsRenderer[uncheck]).toBeCalled();
    expect(getStatus()).toBe(status);
    expect(getTextClasses()).not.toContain('show-first-letters');
    expect(getTextClasses()).not.toContain('show-text');

    pubSub.publish(true);
    await settle();

    expect(game[load]).toBeCalledTimes(2);
  });

  it('should not turn on a hint the user turned off while it loaded', async () => {
    showFirstLettersPubSub.publish(true);
    showFirstLettersPubSub.publish(false);
    showTextPubSub.publish(true);
    showTextPubSub.publish(false);
    await settle();

    expect(getTextClasses()).not.toContain('show-first-letters');
    expect(getTextClasses()).not.toContain('show-text');
  });

  it('should leave the checkbox of a hint the user left while it failed to load', async () => {
    vi.spyOn(game, 'firstLetters').mockRejectedValue(new Error('Test'));
    vi.spyOn(controlsRenderer, 'uncheckFirstLetters');

    showFirstLettersPubSub.publish(true);
    showFirstLettersPubSub.publish(false);
    showTextPubSub.publish(true);
    await settle();

    expect(controlsRenderer.uncheckFirstLetters).not.toBeCalled();
    expect(getTextClasses()).toContain('show-text');
  });
});
