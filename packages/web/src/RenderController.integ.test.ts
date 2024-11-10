import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LexemeAnalyzer } from './lexemeAnalyzer/LexemeAnalyzer';
import { Lexeme } from './lexemeAnalyzer/types';
import { PubSub } from './pubSub/PubSub';
import { RenderController } from './RenderController';
import { ControlsRenderer, GuessEvent } from './renderers/ControlsRenderer';
import { ScoreRenderer } from './renderers/ScoreRenderer';
import { TextRenderer } from './renderers/textRenderer/TextRenderer';

let renderController: RenderController;
let scoreRenderer: ScoreRenderer;

let controlsRenderer: ControlsRenderer;
let guessPubSub: PubSub<GuessEvent>;
let showFirstLettersPubSub: PubSub<boolean>;
let showTextPubSub: PubSub<boolean>;

let textRenderer: TextRenderer;
let userWordShowPubSub: PubSub<Lexeme>;

const lexemesAnalysis = LexemeAnalyzer.analyze(`
  One two
`);

describe(RenderController, () => {
  beforeEach(() => {
    guessPubSub = new PubSub<GuessEvent>();
    showFirstLettersPubSub = new PubSub<boolean>();
    showTextPubSub = new PubSub<boolean>();
    controlsRenderer = new ControlsRenderer({
      guessPubSub,
      showFirstLettersPubSub,
      showTextPubSub,
    });

    scoreRenderer = new ScoreRenderer({ wordLikeCount: lexemesAnalysis.wordLikeCount });

    userWordShowPubSub = new PubSub<Lexeme>();
    textRenderer = new TextRenderer({ lexemesAnalysis, userWordShowPubSub });

    renderController = new RenderController({
      lexemesAnalysis,
      textRenderer,
      scoreRenderer,
      controlsRenderer,
    });

    renderController.init(document.createElement('div'));

    vi.spyOn(scoreRenderer, 'addScore');
    vi.spyOn(controlsRenderer, 'clearAndFocusGuessInput');
  });

  it('should increase the score when the user clicks on a word', () => {
    userWordShowPubSub.publish(lexemesAnalysis.lexemes.get(0) as Lexeme);

    expect(scoreRenderer.addScore).toBeCalledWith(1);
  });

  it('should increase the score if the user guesses a word', () => {
    guessPubSub.publish({ word: 'one' });

    expect(scoreRenderer.addScore).toBeCalledWith(1);
    expect(controlsRenderer.clearAndFocusGuessInput).toBeCalled();
  });

  it('should not change the score if the user does not guess the word', () => {
    guessPubSub.publish({ word: 'unknown' });

    expect(scoreRenderer.addScore).toBeCalledWith(0);
    expect(controlsRenderer.clearAndFocusGuessInput).not.toBeCalled();
  });

  it('should not change the score when the user hides the text', () => {
    showTextPubSub.publish(false);

    expect(scoreRenderer.addScore).not.toBeCalled();
  });

  it('should not change the score when the user hides the first letters', () => {
    showFirstLettersPubSub.publish(false);

    expect(scoreRenderer.addScore).not.toBeCalled();
  });

  it('should shake and error the guess input when the user guesses a word that is not in the text', () => {
    vi.spyOn(controlsRenderer, 'shakeAndError');

    guessPubSub.publish({ word: 'unknown' });

    expect(controlsRenderer.shakeAndError).toBeCalled();
  });
});
