import { newElement, requireElement } from "#/shared/dom.js";
import { ChildRenderer } from "./ChildRenderer";

type ScoreRendererOptions = {
  wordLikeCount: number;
};

export class ScoreRenderer implements ChildRenderer {
  private readonly wordLikeCount: number = 0;
  private score: number = 0;
  private readonly containerElement: HTMLElement;

  constructor(options: ScoreRendererOptions) {
    this.wordLikeCount = options.wordLikeCount;
    this.containerElement = document.createElement("div");
    this.containerElement.id = "score-container";

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
    this.containerElement.replaceChildren(
      newElement(
        "div",
        { id: "score-badge" },
        newElement("div", { id: "current-score" }, String(this.score)),
        newElement(
          "div",
          { id: "score-total" },
          newElement("span", { "aria-hidden": "true" }, "/ "),
          newElement("span", { class: "visually-hidden" }, "of "),
          newElement("span", { id: "total-score" }, String(this.wordLikeCount)),
        ),
      ),
      newElement(
        "div",
        { id: "score-details" },
        newElement(
          "div",
          { id: "score-label", "aria-live": "polite" },
          newElement("span", { id: "score-percent" }),
          " found",
        ),
        newElement(
          "div",
          {
            id: "score-progress",
            role: "progressbar",
            "aria-label": "Words found",
            "aria-valuemin": 0,
            "aria-valuemax": this.wordLikeCount,
          },
          newElement("div", { id: "score-progress-bar" }),
        ),
      ),
    );

    this.renderProgress();
  }

  private renderProgress() {
    const { percentElement, progressElement, progressBarElement } = this.getElements();
    // Rounded down, so 100% appears only once every word is found
    const percent = this.wordLikeCount ? Math.floor((this.score / this.wordLikeCount) * 100) : 0;

    percentElement.textContent = `${percent}%`;
    progressElement.setAttribute("aria-valuenow", this.score.toString());
    progressBarElement.style.width = `${percent}%`;
  }

  private getElements() {
    const currentScoreElement = requireElement({
      root: this.containerElement,
      selector: "#current-score",
      type: HTMLElement,
    });
    const percentElement = requireElement({
      root: this.containerElement,
      selector: "#score-percent",
      type: HTMLElement,
    });
    const progressElement = requireElement({
      root: this.containerElement,
      selector: "#score-progress",
      type: HTMLElement,
    });
    const progressBarElement = requireElement({
      root: this.containerElement,
      selector: "#score-progress-bar",
      type: HTMLElement,
    });

    return { currentScoreElement, percentElement, progressElement, progressBarElement };
  }
}
