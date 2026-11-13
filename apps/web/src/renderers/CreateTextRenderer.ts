import { createTextLimits } from "@guessir/game";

import copyIcon from "../icons/copyIcon.svg?raw";
import { onChangeAndEnter, requireElement } from "../utils/dom";
import { icon } from "../utils/icon";
import { HttpClient } from "../utils/HttpClient";
import { textUrl } from "../utils/text";
import { createText } from "./createTextApi";
import { ChildRenderer } from "./types";
import { Logger } from "../utils/Logger";

const logger = Logger.root.scope("CreateTextRenderer");

interface CreateTextRendererOptions {
  httpClient: HttpClient;
  /** The page origin the link to a created text starts with. */
  origin: string;
  clipboard: Pick<Clipboard, "writeText">;
  maxTitleLength?: number;
  maxDescriptionLength?: number;
  maxTextLength?: number;
}

/**
 * Returns the markup of a labelled form field. The limit counter sits in the control's direct
 * parent, where `limitInputsLength` looks for it.
 */
function renderField({
  id,
  label,
  hint,
  control,
}: {
  id: string;
  label: string;
  hint: string;
  control: string;
}) {
  return `
    <div class="field">
      <div class="field-header"><label for="${id}">${label}</label><span class="field-hint">${hint}</span></div>
      <div class="field-control">
        ${control}
        <div class="limit-text">0/0</div>
      </div>
    </div>
  `;
}

export class CreateTextRenderer implements ChildRenderer {
  private readonly containerElement: HTMLElement;
  private generatedUrl = "";
  private readonly copiedAlertElement = document.createElement("div");
  private readonly maxTitleLength: number;
  private readonly maxDescriptionLength: number;
  private readonly maxTextLength: number;
  private readonly httpClient: HttpClient;
  private readonly origin: string;
  private readonly clipboard: Pick<Clipboard, "writeText">;

  constructor(options: CreateTextRendererOptions) {
    this.containerElement = document.createElement("div");
    this.containerElement.id = "utils-container";

    this.httpClient = options.httpClient;
    this.origin = options.origin;
    this.clipboard = options.clipboard;

    this.maxTitleLength = options.maxTitleLength ?? createTextLimits.title;
    this.maxDescriptionLength = options.maxDescriptionLength ?? createTextLimits.description;
    this.maxTextLength = options.maxTextLength ?? createTextLimits.text;

    this.copiedAlertElement.textContent = "(copied)";

    this.initElement();
  }

  getElement(): HTMLElement {
    return this.containerElement;
  }

  private initElement() {
    this.containerElement.innerHTML = `
      <details>
        <summary>
          <span class="summary-title">Make your own game</span>
          <span class="summary-text">Paste any English text, share the link and race your friends.</span>
        </summary>
        <div id="create-form">
          ${renderField({ id: "title-input", label: "Title", hint: "required", control: '<input id="title-input" type="text">' })}
          ${renderField({
            id: "description-input",
            label: "Description",
            hint: "optional",
            control: '<textarea rows="2" id="description-input"></textarea>',
          })}
          ${renderField({ id: "text-input", label: "Text", hint: "required", control: '<textarea rows="6" id="text-input"></textarea>' })}
          <div class="chips">
            <label class="chip">
              <input checked type="checkbox" id="allow-showing-first-letters-checkbox">Allow first-letter hints
            </label>
            <label class="chip">
              <input checked type="checkbox" id="allow-showing-text-checkbox">Allow peeking at the text
            </label>
          </div>
          <div id="generate-url-button-container">
            <button id="generate-url-button" type="button">Create game</button>
            <div class="hide" id="generated-url-container">
              <a href="#" id="generated-url" target="_blank">#</a>
              <button id="copy-generated-url-button" type="button" aria-label="Copy link">
                ${icon(copyIcon)}
              </button>
            </div>
          </div>
          <div id="generate-url-error" class="error hide" role="alert"></div>
        </div>
      </details>
    `;

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
   * Returns whether the title and the text are both filled in. When the caller gives
   * `limitToElement`, the check marks only that field. A user who is typing then sees no error on
   * other fields yet.
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

      createText(this.httpClient, this.getValues())
        .then((apiText) => {
          this.cleanForm();

          this.generatedUrl = textUrl(this.origin, apiText.id);

          generatedUrlContainerElement.classList.remove("hide");

          generatedUrlElement.textContent = this.generatedUrl;
          generatedUrlElement.href = this.generatedUrl;
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
    let changeTextTimeoutId: ReturnType<typeof setTimeout> | undefined;

    copyGeneratedUrlButtonElement.addEventListener("click", () => {
      void this.clipboard.writeText(this.generatedUrl);
      copyGeneratedUrlButtonElement.appendChild(this.copiedAlertElement);

      if (changeTextTimeoutId) {
        clearTimeout(changeTextTimeoutId);
      }

      changeTextTimeoutId = setTimeout(() => {
        this.removeCopyAlert();
      }, 5000);
    });
  }
}

export function getElements(containerElement: HTMLElement) {
  const titleInputElement = requireElement({
    root: containerElement,
    selector: "#title-input",
    type: HTMLInputElement,
  });
  const descriptionInputElement = requireElement({
    root: containerElement,
    selector: "#description-input",
    type: HTMLTextAreaElement,
  });
  const textInputElement = requireElement({
    root: containerElement,
    selector: "#text-input",
    type: HTMLTextAreaElement,
  });
  const allowShowingFirstLettersCheckboxElement = requireElement({
    root: containerElement,
    selector: "#allow-showing-first-letters-checkbox",
    type: HTMLInputElement,
  });
  const allowShowingTextCheckboxElement = requireElement({
    root: containerElement,
    selector: "#allow-showing-text-checkbox",
    type: HTMLInputElement,
  });
  const generateUrlButtonElement = requireElement({
    root: containerElement,
    selector: "#generate-url-button",
    type: HTMLButtonElement,
  });
  const errorElement = requireElement({
    root: containerElement,
    selector: "#generate-url-error",
    type: HTMLElement,
  });
  const generatedUrlContainerElement = requireElement({
    root: containerElement,
    selector: "#generated-url-container",
    type: HTMLElement,
  });
  const generatedUrlElement = requireElement({
    root: containerElement,
    selector: "#generated-url",
    type: HTMLAnchorElement,
  });
  const copyGeneratedUrlButtonElement = requireElement({
    root: containerElement,
    selector: "#copy-generated-url-button",
    type: HTMLButtonElement,
  });

  return {
    titleInputElement,
    descriptionInputElement,
    textInputElement,
    allowShowingFirstLettersCheckboxElement,
    allowShowingTextCheckboxElement,
    generateUrlButtonElement,
    errorElement,
    generatedUrlContainerElement,
    generatedUrlElement,
    copyGeneratedUrlButtonElement,
  };
}
