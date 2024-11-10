import { ChildRenderer } from './types';

type ScoreRendererOptions = {
  wordLikeCount: number;
};

export class ScoreRenderer implements ChildRenderer {
  private readonly wordLikeCount: number = 0;
  private score: number = 0;
  private readonly containerElement: HTMLElement;

  constructor(options: ScoreRendererOptions) {
    this.wordLikeCount = options.wordLikeCount;
    this.containerElement = document.createElement('div');
    this.containerElement.id = 'score-container';

    this.initElement();
  }

  public getElement(): HTMLElement {
    return this.containerElement;
  }

  public addScore(value: number) {
    this.score += value;

    const { currentScoreElement } = this.getElements();

    currentScoreElement.textContent = this.score.toString();
  }

  private initElement() {
    this.containerElement.innerHTML = `
      Score:&nbsp;
      <div id="current-score">${this.score}</div>
      /
      <div id="total-score">${this.wordLikeCount}</div>
    `;
  }

  private getElements() {
    const currentScoreElement = this.containerElement.querySelector('#current-score') as HTMLElement;

    return { currentScoreElement };
  }
}
