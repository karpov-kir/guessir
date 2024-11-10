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
        <summary>Create a new text</summary>
        <div>
          <div class="inline-flex relative">
            <input id="title-input" type="text" placeholder="Title*">
            <div class="limit-text">0/0</div>
          </div>
        </div>
        <div>
          <div class="inline-flex relative">
            <textarea rows="2" class="w-100" id="description-input" placeholder="Description"></textarea>
            <div class="limit-text">0/0</div>
          </div>
        </div>
        <div class="flex relative">
            <textarea rows="5" class="w-100" id="text-input" placeholder="Text*"></textarea>
            <div class="limit-text">0/0</div>
        </div>
        <div class="flex">
          <label>
            <input checked type="checkbox" id="allow-showing-first-letters-checkbox">Allow showing first letters
          </label>
          <br />
          <label>
            <input checked type="checkbox" id="allow-showing-text-checkbox">Allow showing text
          </label>
        </div>
        <div id="generate-url-button-container">
          <div class="relative">
            <div id="generate-url-error" class="error hide"></div>
            <button id="generate-url-button" type="button">Create</button>
          </div>
        </div>
        <div class="hide flex" id="generated-url-container">
          <button id="copy-generated-url-button" type="button">
            ${copyIcon}
          </button>
          <a href="#" id="generated-url" target="_blank">#</a>
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

  private validateForm(limitToElement?: HTMLElement) {
    const { titleInputElement, textInputElement } = this.getElements();

    const { title, text } = this.getValues();
    const isValid = Boolean(title && text);

    if (!limitToElement || limitToElement === titleInputElement) {
      if (!title) {
        titleInputElement.classList.add('invalid');
      } else {
        titleInputElement.classList.remove('invalid');
      }
    }

    if (!limitToElement || limitToElement === textInputElement) {
      if (!text) {
        textInputElement.classList.add('invalid');
      } else {
        textInputElement.classList.remove('invalid');
      }
    }

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
