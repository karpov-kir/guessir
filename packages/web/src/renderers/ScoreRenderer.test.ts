import { beforeEach, describe, expect, it } from 'vitest';

import { getElementText } from '../../tests/utils/dom';
import { ScoreRenderer } from './ScoreRenderer';

let scoreRenderer: ScoreRenderer;

describe(ScoreRenderer, () => {
  beforeEach(() => {
    scoreRenderer = new ScoreRenderer({
      wordLikeCount: 10,
    });
  });

  it('should set the total score', () => {
    const totalScore = getElementText(scoreRenderer.getElement(), '#total-score');
    const currentScore = getElementText(scoreRenderer.getElement(), '#current-score');

    expect(totalScore).toEqual('10');
    expect(currentScore).toEqual('0');
  });

  it('should update the current score', () => {
    scoreRenderer.addScore(5);
    scoreRenderer.addScore(-2);
    scoreRenderer.addScore(-1);
    scoreRenderer.addScore(2);

    const totalScore = getElementText(scoreRenderer.getElement(), '#total-score');
    const currentScore = getElementText(scoreRenderer.getElement(), '#current-score');

    expect(totalScore).toEqual('10');
    expect(currentScore).toEqual('4');
  });
});
