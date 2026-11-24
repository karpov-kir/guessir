import { createTextLimits } from "@guessir/game";

import "./CreateTextRenderer.css";
import copyIcon from "./copyIcon.svg?raw";
import { newElement, onChangeAndEnter } from "#/shared/dom.js";
import { icon } from "#/shared/icon.js";
import { AnalyticsEvents } from "#/entities/analytics/exports.js";
import { track } from "#/shared/analytics.js";
import { textUrl } from "#/entities/textLink/exports.js";
import { createText } from "./createText";
import { getElements } from "./formElements";
import type { ClipboardWriter, CreateTextApi } from "./port";
import type { Clock } from "#/shared/Clock.js";
import { Logger } from "@guessir/logger";

const logger = Logger.root.scope("createText");

export type CreateTextUseCasesOptions = {
  api: CreateTextApi;
  /** The page origin the link to a created text starts with. */
  origin: string;
  clipboard: ClipboardWriter;
  /** Hides the alert that a link was copied once its time passes. */
  clock: Pick<Clock, "schedule">;
  maxTitleLength?: number;
  maxDescriptionLength?: number;
  maxTextLength?: number;
};

/** How long the alert that a link was copied stays on the copy button. */
const copiedAlertMs = 5_000;

/**
 * Returns a labelled form field around `control`. The limit counter sits in the control's direct
 * parent, where `limitInputsLength` looks for it.
 */
function newField({
  id,
  label,
  hint,
  control,
}: {
  id: string;
  label: string;
  hint: string;
  control: HTMLElement;
}) {
  return newElement(
    "div",
    { class: "field" },
    newElement(
      "div",
      { class: "field-header" },
      newElement("label", { for: id }, label),
      newElement("span", { class: "field-hint" }, hint),
    ),
    newElement(
      "div",
      { class: "field-control" },
      control,
      newElement("div", { class: "limit-text" }, "0/0"),
    ),
  );
}

/** Shows the form that stores a new text and gives its link. */
export class CreateTextUseCases {
  private readonly containerElement: HTMLElement;
  private generatedUrl = "";
  private readonly copiedAlertElement = document.createElement("div");
  private readonly maxTitleLength: number;
  private readonly maxDescriptionLength: number;
  private readonly maxTextLength: number;
  private readonly deps: Pick<CreateTextUseCasesOptions, "api" | "clipboard" | "clock">;
  private readonly origin: string;

  constructor({
    origin,
    maxTitleLength,
    maxDescriptionLength,
    maxTextLength,
    ...deps
  }: CreateTextUseCasesOptions) {
    this.containerElement = document.createElement("div");
    this.containerElement.id = "utils-container";

    this.deps = deps;
    this.origin = origin;
    this.maxTitleLength = maxTitleLength ?? createTextLimits.title;
    this.maxDescriptionLength = maxDescriptionLength ?? createTextLimits.description;
    this.maxTextLength = maxTextLength ?? createTextLimits.text;

    this.copiedAlertElement.textContent = "(copied)";

    this.initElement();
  }

  /** Returns the form, ready to place in the page. */
  getElement(): HTMLElement {
    return this.containerElement;
  }

  private initElement() {
    this.containerElement.replaceChildren(
      newElement(
        "details",
        {},
        newElement(
          "summary",
          {},
          newElement("span", { class: "summary-title" }, "Make your own game"),
          newElement(
            "span",
            { class: "summary-text" },
            "Paste any English text, share the link and race your friends.",
          ),
        ),
        newElement(
          "div",
          { id: "create-form" },
          newField({
            id: "title-input",
            label: "Title",
            hint: "required",
            control: newElement("input", { id: "title-input", type: "text" }),
          }),
          newField({
            id: "description-input",
            label: "Description",
            hint: "optional",
            control: newElement("textarea", { rows: 2, id: "description-input" }),
          }),
          newField({
            id: "text-input",
            label: "Text",
            hint: "required",
            control: newElement("textarea", { rows: 6, id: "text-input" }),
          }),
          newElement(
            "div",
            { class: "chips" },
            newElement(
              "label",
              { class: "chip" },
              newElement("input", {
                checked: true,
                type: "checkbox",
                id: "allow-showing-first-letters-checkbox",
              }),
              "Allow first-letter hints",
            ),
            newElement(
              "label",
              { class: "chip" },
              newElement("input", {
                checked: true,
                type: "checkbox",
                id: "allow-showing-text-checkbox",
              }),
              "Allow peeking at the text",
            ),
          ),
          newElement(
            "div",
            { id: "generate-url-button-container" },
            newElement("button", { id: "generate-url-button", type: "button" }, "Create game"),
            newElement(
              "div",
              { class: "hide", id: "generated-url-container" },
              newElement("a", { href: "#", id: "generated-url", target: "_blank" }, "#"),
              newElement(
                "button",
                { id: "copy-generated-url-button", type: "button", "aria-label": "Copy link" },
                icon(copyIcon),
              ),
            ),
          ),
          newElement("div", { id: "generate-url-error", class: "error hide", role: "alert" }),
        ),
      ),
    );

    this.attachInputHandlers();
    this.attachGenerateUrlHandler();
    this.attachCopyGeneratedUrlHandler();
  }

  private getElements() {
    return getElements(this.containerElement);
  }

  private getValues() {
    const {
      titleInputElement,
      descriptionInputElement,
      textInputElement,
      allowShowingFirstLettersCheckboxElement,
      allowShowingTextCheckboxElement,
    } = this.getElements();

    const title = titleInputElement.value.trim();
    const rawDescription = descriptionInputElement.value.trim();
    const text = textInputElement.value.trim();
    const allowShowingFirstLetters = allowShowingFirstLettersCheckboxElement.checked;
    const allowShowingText = allowShowingTextCheckboxElement.checked;

    return {
      title,
      description: rawDescription || undefined,
      text,
      allowShowingFirstLetters,
      allowShowingText,
    };
  }

  private limitInputsLength() {
    const { titleInputElement, descriptionInputElement, textInputElement } = this.getElements();

    // The function counts and cuts in code points, not UTF-16 units. The server and its Postgres
    // columns count code points. So the server accepts every value that the form keeps.
    const limitLength = (element: HTMLInputElement | HTMLTextAreaElement, maxLength: number) => {
      let codePoints = Array.from(element.value.trim());

      if (codePoints.length > maxLength) {
        codePoints = codePoints.slice(0, maxLength);
        element.value = codePoints.join("");
      }

      const limitTextElement = element.parentElement?.querySelector(".limit-text");

      if (limitTextElement) {
        limitTextElement.textContent = `${codePoints.length}/${maxLength}`;
      }
    };

    limitLength(titleInputElement, this.maxTitleLength);
    limitLength(descriptionInputElement, this.maxDescriptionLength);
    limitLength(textInputElement, this.maxTextLength);
  }

  /**
   * Returns whether the title and the text are both filled in. Given `limitToElement`, the check
   * marks only that field, so a user who is typing sees no error on other fields yet.
   */
  private validateForm(limitToElement?: HTMLElement) {
    const { titleInputElement, textInputElement } = this.getElements();

    const { title, text } = this.getValues();
    const isValid = Boolean(title && text);

    const markValidity = (element: HTMLElement, isElementValid: boolean) => {
      if (limitToElement && limitToElement !== element) {
        return;
      }

      element.classList.toggle("invalid", !isElementValid);
      element.setAttribute("aria-invalid", String(!isElementValid));
    };

    markValidity(titleInputElement, Boolean(title));
    markValidity(textInputElement, Boolean(text));

    return isValid;
  }

  private blockForm(isBlocked: boolean) {
    const {
      titleInputElement,
      descriptionInputElement,
      textInputElement,
      allowShowingFirstLettersCheckboxElement,
      allowShowingTextCheckboxElement,
      generateUrlButtonElement,
    } = this.getElements();

    [
      titleInputElement,
      descriptionInputElement,
      textInputElement,
      allowShowingFirstLettersCheckboxElement,
      allowShowingTextCheckboxElement,
      generateUrlButtonElement,
    ].forEach((element) => {
      element.disabled = isBlocked;
    });
  }

  private cleanForm() {
    const {
      titleInputElement,
      descriptionInputElement,
      textInputElement,
      allowShowingFirstLettersCheckboxElement,
      allowShowingTextCheckboxElement,
    } = this.getElements();

    [titleInputElement, descriptionInputElement, textInputElement].forEach((element) => {
      element.value = "";
    });

    [allowShowingFirstLettersCheckboxElement, allowShowingTextCheckboxElement].forEach(
      (element) => {
        element.checked = true;
      },
    );

    this.limitInputsLength();
  }

  private attachInputHandlers() {
    const {
      titleInputElement,
      descriptionInputElement,
      textInputElement,
      allowShowingFirstLettersCheckboxElement,
      allowShowingTextCheckboxElement,
    } = this.getElements();

    this.limitInputsLength();

    [titleInputElement, descriptionInputElement, textInputElement].forEach((element) => {
      element.addEventListener("input", () => {
        this.handleInputsChange(element);
      });
    });

    [allowShowingFirstLettersCheckboxElement, allowShowingTextCheckboxElement].forEach(
      (element) => {
        onChangeAndEnter(
          element,
          () => {
            this.handleInputsChange(element);
          },
          {
            toggleChecked: true,
          },
        );
      },
    );
  }

  private handleInputsChange(inputElement: HTMLElement) {
    const { errorElement, generatedUrlContainerElement } = this.getElements();

    errorElement.classList.add("hide");
    generatedUrlContainerElement.classList.add("hide");

    this.removeCopyAlert();
    this.limitInputsLength();
    this.validateForm(inputElement);
  }

  private attachGenerateUrlHandler() {
    const {
      generateUrlButtonElement,
      errorElement,
      generatedUrlContainerElement,
      generatedUrlElement,
    } = this.getElements();

    generateUrlButtonElement.addEventListener("click", () => {
      if (!this.validateForm()) {
        return;
      }

      this.blockForm(true);
      generatedUrlContainerElement.classList.add("hide");

      createText(this.deps.api, this.getValues())
        .then((apiText) => {
          this.cleanForm();

          this.generatedUrl = textUrl(this.origin, apiText.id);

          generatedUrlContainerElement.classList.remove("hide");

          generatedUrlElement.textContent = this.generatedUrl;
          generatedUrlElement.href = this.generatedUrl;
          track(AnalyticsEvents.TextCreated);
        })
        .catch((error: unknown) => {
          logger.error("Failed to create the text", error);
          errorElement.classList.remove("hide");
          errorElement.textContent =
            error instanceof Error ? error.message : "Could not create the text";
        })
        .finally(() => {
          this.blockForm(false);
        });
    });
  }

  private removeCopyAlert() {
    const { copyGeneratedUrlButtonElement } = this.getElements();

    if (copyGeneratedUrlButtonElement.contains(this.copiedAlertElement)) {
      copyGeneratedUrlButtonElement.removeChild(this.copiedAlertElement);
    }
  }

  private attachCopyGeneratedUrlHandler() {
    const { copyGeneratedUrlButtonElement } = this.getElements();
    let cancelAlertTimer: (() => void) | undefined;

    copyGeneratedUrlButtonElement.addEventListener("click", () => {
      void this.deps.clipboard.writeText(this.generatedUrl);
      track(AnalyticsEvents.GameLinkCopied);
      copyGeneratedUrlButtonElement.appendChild(this.copiedAlertElement);

      cancelAlertTimer?.();
      cancelAlertTimer = this.deps.clock.schedule(() => {
        this.removeCopyAlert();
      }, copiedAlertMs);
    });
  }
}

/** Returns the use cases that store new texts through the API `options` names. */
export function newCreateTextUseCases(options: CreateTextUseCasesOptions): CreateTextUseCases {
  return new CreateTextUseCases(options);
}
