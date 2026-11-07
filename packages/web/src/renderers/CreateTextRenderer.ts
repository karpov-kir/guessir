import copyIcon from '../icons/copyIcon.svg?raw';
import { ApiClient } from '../utils/ApiClient';
import { onChangeAndEnter } from '../utils/dom';
import { generateTextUrl } from '../utils/text';
import { ChildRenderer } from './types';

interface CreateTextRendererOptions {
  maxTitleLength?: number;
  maxDescriptionLength?: number;
  maxTextLength?: number;
  apiClient?: ApiClient;
}

/**
 * Returns the markup of a labelled form field. The limit counter sits in the control's direct parent,
 * where `limitInputsLength` looks for it.
 */
function renderField({ id, label, hint, control }: { id: string; label: string; hint: string; control: string }) {
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
  private generatedUrl = '';
  private readonly copiedAlertElement = document.createElement('div');
  private readonly maxTitleLength: number = 0;
  private readonly maxDescriptionLength: number = 0;
  private readonly maxTextLength: number = 0;
  private readonly apiClient: ApiClient;

  constructor(options: CreateTextRendererOptions = {}) {
    this.containerElement = document.createElement('div');
    this.containerElement.id = 'utils-container';

    this.apiClient = options.apiClient || new ApiClient();

    this.maxTitleLength = options.maxTitleLength ?? 500;
    this.maxDescriptionLength = options.maxDescriptionLength ?? 4000;
    this.maxTextLength = options.maxTextLength || 4000;

    this.copiedAlertElement.textContent = '(copied)';

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
          ${renderField({ id: 'title-input', label: 'Title', hint: 'required', control: '<input id="title-input" type="text">' })}
          ${renderField({
            id: 'description-input',
            label: 'Description',
            hint: 'optional',
            control: '<textarea rows="2" id="description-input"></textarea>',
          })}
          ${renderField({ id: 'text-input', label: 'Text', hint: 'required', control: '<textarea rows="6" id="text-input"></textarea>' })}
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
                ${copyIcon}
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

    return { title, description: rawDescription || undefined, text, allowShowingFirstLetters, allowShowingText };
  }

  private limitInputsLength() {
    const { titleInputElement, descriptionInputElement, textInputElement } = this.getElements();

    const limitLength = (element: HTMLInputElement, maxLength: number) => {
      let value = element.value.trim();

      if (value.length > maxLength) {
        value = value.substring(0, maxLength);
        element.value = value;
      }

      const limitTextElement = element.parentElement?.querySelector('.limit-text');

      if (limitTextElement) {
        limitTextElement.innerHTML = `${value.length}/${maxLength}`;
      }
    };

    limitLength(titleInputElement, this.maxTitleLength);
    limitLength(descriptionInputElement, this.maxDescriptionLength);
    limitLength(textInputElement, this.maxTextLength);
  }

  /**
   * Returns whether the title and the text are both filled in. When the caller gives `limitToElement`,
   * the check marks only that field, so a user who is typing sees no error on other fields yet.
   */
  private validateForm(limitToElement?: HTMLElement) {
    const { titleInputElement, textInputElement } = this.getElements();

    const { title, text } = this.getValues();
    const isValid = Boolean(title && text);

    const markValidity = (element: HTMLElement, isElementValid: boolean) => {
      if (limitToElement && limitToElement !== element) {
        return;
      }

      element.classList.toggle('invalid', !isElementValid);
      element.setAttribute('aria-invalid', String(!isElementValid));
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
      element.value = '';
    });

    [allowShowingFirstLettersCheckboxElement, allowShowingTextCheckboxElement].forEach((element) => {
      element.checked = true;
    });

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
      element.addEventListener('input', (event) => {
        this.handleInputsChange(event.currentTarget as HTMLElement);
      });
    });

    [allowShowingFirstLettersCheckboxElement, allowShowingTextCheckboxElement].forEach((element) => {
      onChangeAndEnter(
        element,
        (event) => {
          this.handleInputsChange(event.currentTarget as HTMLElement);
        },
        {
          toggleChecked: true,
        },
      );
    });
  }

  private handleInputsChange(inputElement: HTMLElement) {
    const { errorElement, generatedUrlContainerElement } = this.getElements();

    errorElement.classList.add('hide');
    generatedUrlContainerElement.classList.add('hide');

    this.removeCopyAlert();
    this.limitInputsLength();
    this.validateForm(inputElement);
  }

  private attachGenerateUrlHandler() {
    const { generateUrlButtonElement, errorElement, generatedUrlContainerElement, generatedUrlElement } =
      this.getElements();

    generateUrlButtonElement.addEventListener('click', () => {
      if (!this.validateForm()) {
        return;
      }

      this.blockForm(true);
      generatedUrlContainerElement.classList.add('hide');

      this.apiClient
        .createText(this.getValues())
        .then((apiText) => {
          this.cleanForm();

          this.generatedUrl = generateTextUrl(apiText);

          generatedUrlContainerElement.classList.remove('hide');

          generatedUrlElement.textContent = this.generatedUrl;
          generatedUrlElement.href = this.generatedUrl;
        })
        .catch((error: Error) => {
          console.error(error);
          errorElement.classList.remove('hide');
          errorElement.textContent = error.message;
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

    copyGeneratedUrlButtonElement.addEventListener('click', () => {
      navigator.clipboard.writeText(this.generatedUrl);
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
  const titleInputElement = containerElement.querySelector('#title-input') as HTMLInputElement;
  const descriptionInputElement = containerElement.querySelector('#description-input') as HTMLInputElement;
  const textInputElement = containerElement.querySelector('#text-input') as HTMLInputElement;
  const allowShowingFirstLettersCheckboxElement = containerElement.querySelector(
    '#allow-showing-first-letters-checkbox',
  ) as HTMLInputElement;
  const allowShowingTextCheckboxElement = containerElement.querySelector(
    '#allow-showing-text-checkbox',
  ) as HTMLInputElement;
  const generateUrlButtonElement = containerElement.querySelector('#generate-url-button') as HTMLButtonElement;
  const errorElement = containerElement.querySelector('#generate-url-error') as HTMLButtonElement;
  const generatedUrlContainerElement = containerElement.querySelector('#generated-url-container') as HTMLElement;
  const generatedUrlElement = containerElement.querySelector('#generated-url') as HTMLAnchorElement;
  const copyGeneratedUrlButtonElement = containerElement.querySelector(
    '#copy-generated-url-button',
  ) as HTMLAnchorElement;

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
