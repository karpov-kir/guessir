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

  it('should show the progress', () => {
    const getProgressElement = () => scoreRenderer.getElement().querySelector('[role="progressbar"]') as HTMLElement;
    const getProgressBarElement = () => getProgressElement().firstElementChild as HTMLElement;

    expect(getProgressElement().getAttribute('aria-valuenow')).toBe('0');
    expect(getProgressElement().getAttribute('aria-valuemax')).toBe('10');
    expect(getProgressBarElement().style.width).toBe('0%');
    expect(getElementText(scoreRenderer.getElement(), '#score-percent')).toBe('0%');

    scoreRenderer.addScore(3);

    expect(getProgressElement().getAttribute('aria-valuenow')).toBe('3');
    expect(getProgressBarElement().style.width).toBe('30%');
    expect(getElementText(scoreRenderer.getElement(), '#score-percent')).toBe('30%');
  });

  it('should not show 100% while words are still hidden', () => {
    const longScoreRenderer = new ScoreRenderer({ wordLikeCount: 700 });

    longScoreRenderer.addScore(697);

    expect(getElementText(longScoreRenderer.getElement(), '#score-percent')).toBe('99%');
  });

  it('should show no progress for a text without words', () => {
    const emptyScoreRenderer = new ScoreRenderer({ wordLikeCount: 0 });

    expect(getElementText(emptyScoreRenderer.getElement(), '#score-percent')).toBe('0%');
  });
});
