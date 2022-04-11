import { Lexeme, LexemeAnalyzer } from '../lexemeAnalyzer';
import { PubSub } from '../pubSub';
import { ControlsRenderer, GuessEvent } from './ControlsRenderer';
import { RenderController } from './RenderController';
import { ScoreRenderer } from './ScoreRenderer';
import { TextRenderer } from './textRenderer';

let interceptedPubSubs: PubSub<unknown>[] = [];

jest.mock('../pubSub', () => {
  const { PubSub: OriginalPubSub } = jest.requireActual<{
    PubSub: { new (): PubSub<unknown> };
  }>('../pubSub');

  return {
    PubSub: class InterceptedPubSub extends OriginalPubSub {
      constructor() {
        super();
        interceptedPubSubs.push(this);
      }
    },
  };
});

let renderController: RenderController;
let scoreRenderer: ScoreRenderer;

let controlsRenderer: ControlsRenderer;
let guessPubSub: PubSub<GuessEvent>;
let showFirstLettersPubSub: PubSub<boolean>;
let showTextPubSub: PubSub<boolean>;

let textRenderer: TextRenderer;
let userWordShowPubSub: PubSub<Lexeme>;

const lexemesAnalysis = new LexemeAnalyzer().analyze(`
  One two
`);

describe(RenderController, () => {
  beforeEach(() => {
    jest.clearAllMocks();
    interceptedPubSubs = [];

    controlsRenderer = new ControlsRenderer();
    guessPubSub = interceptedPubSubs[0] as typeof guessPubSub;
    showFirstLettersPubSub = interceptedPubSubs[1] as typeof showFirstLettersPubSub;
    showTextPubSub = interceptedPubSubs[2] as typeof showTextPubSub;

    scoreRenderer = new ScoreRenderer({ wordLikeCount: lexemesAnalysis.wordLikeCount });

    interceptedPubSubs = [];
    textRenderer = new TextRenderer({ lexemesAnalysis });
    userWordShowPubSub = interceptedPubSubs[0] as typeof userWordShowPubSub;

    renderController = new RenderController({
      lexemesAnalysis,
      textRenderer,
      scoreRenderer,
      controlsRenderer,
    });

    renderController.init(document.createElement('div'));

    jest.spyOn(scoreRenderer, 'addScore');
    jest.spyOn(controlsRenderer, 'cleanAndFocusGuessInput');
  });

  it('should reduce the score when the user clicks on a word', () => {
    userWordShowPubSub.publish(lexemesAnalysis.lexemes.get(0) as Lexeme);

    expect(scoreRenderer.addScore).toBeCalledWith(-1);
  });

  it('should increase the score if the user guesses a word', () => {
    guessPubSub.publish({ word: 'one' });

    expect(scoreRenderer.addScore).toBeCalledWith(1);
    expect(controlsRenderer.cleanAndFocusGuessInput).toBeCalled();
  });

  it('should not change the score if the user does not guess the word', () => {
    guessPubSub.publish({ word: 'unknown' });

    expect(scoreRenderer.addScore).toBeCalledWith(0);
    expect(controlsRenderer.cleanAndFocusGuessInput).not.toBeCalled();
  });

  it('should reduce the score when the user shows the text', () => {
    showTextPubSub.publish(true);

    expect(scoreRenderer.addScore).toBeCalledWith(-7);
  });

  it('should not change the score when the user hides the text', () => {
    showTextPubSub.publish(false);

    expect(scoreRenderer.addScore).not.toBeCalled();
  });

  it('should reduce the score when the user shows the first letters', () => {
    showFirstLettersPubSub.publish(true);

    expect(scoreRenderer.addScore).toBeCalledWith(-2);
  });

  it('should not change the score when the user hides the first letters', () => {
    showFirstLettersPubSub.publish(false);

    expect(scoreRenderer.addScore).not.toBeCalled();
  });
});
