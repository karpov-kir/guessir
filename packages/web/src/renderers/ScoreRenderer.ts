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
    this.renderProgress();
  }

  private initElement() {
    this.containerElement.innerHTML = `
      <div id="score-badge">
        <div id="current-score">${this.score}</div>
        <div id="score-total"><span aria-hidden="true">/ </span><span class="visually-hidden">of </span><span id="total-score">${this.wordLikeCount}</span></div>
      </div>
      <div id="score-details">
        <div id="score-label" aria-live="polite"><span id="score-percent"></span> found</div>
        <div id="score-progress" role="progressbar" aria-label="Words found" aria-valuemin="0" aria-valuemax="${this.wordLikeCount}">
          <div id="score-progress-bar"></div>
        </div>
      </div>
    `;

    this.renderProgress();
  }

  private renderProgress() {
    const { percentElement, progressElement, progressBarElement } = this.getElements();
    // Rounded down, so 100% appears only once every word is found
    const percent = this.wordLikeCount ? Math.floor((this.score / this.wordLikeCount) * 100) : 0;

    percentElement.textContent = `${percent}%`;
    progressElement.setAttribute('aria-valuenow', this.score.toString());
    progressBarElement.style.width = `${percent}%`;
  }

  private getElements() {
    const currentScoreElement = this.containerElement.querySelector('#current-score') as HTMLElement;
    const percentElement = this.containerElement.querySelector('#score-percent') as HTMLElement;
    const progressElement = this.containerElement.querySelector('#score-progress') as HTMLElement;
    const progressBarElement = this.containerElement.querySelector('#score-progress-bar') as HTMLElement;

    return { currentScoreElement, percentElement, progressElement, progressBarElement };
  }
}
