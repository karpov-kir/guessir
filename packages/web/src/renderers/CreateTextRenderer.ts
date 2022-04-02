import { createText, generateTextUrl, onChangeAndEnter } from '../utils';
import { ChildrenRenderer } from './types';

export class CreateTextRenderer implements ChildrenRenderer {
  private containerElement: HTMLElement;
  private generatedUrl = '';
  private copiedAlertElement = document.createElement('div');

  constructor() {
    this.containerElement = document.createElement('div');
    this.containerElement.id = 'utils-container';

    this.copiedAlertElement.innerText = '(copied)';

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
            <!-- TODO migrate to import -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 21H12C11.2044 21 10.4413 20.6839 9.87868 20.1213C9.31607 19.5587 9 18.7956 9 18V12C9 11.2044 9.31607 10.4413 9.87868 9.87868C10.4413 9.31607 11.2044 9 12 9H18C18.7956 9 19.5587 9.31607 20.1213 9.87868C20.6839 10.4413 21 11.2044 21 12V18C21 18.7956 20.6839 19.5587 20.1213 20.1213C19.5587 20.6839 18.7956 21 18 21ZM12 11C11.7348 11 11.4804 11.1054 11.2929 11.2929C11.1054 11.4804 11 11.7348 11 12V18C11 18.2652 11.1054 18.5196 11.2929 18.7071C11.4804 18.8946 11.7348 19 12 19H18C18.2652 19 18.5196 18.8946 18.7071 18.7071C18.8946 18.5196 19 18.2652 19 18V12C19 11.7348 18.8946 11.4804 18.7071 11.2929C18.5196 11.1054 18.2652 11 18 11H12Z" fill="#C7C7C7"/>
              <path d="M9.73 15H5.67C4.96268 14.9974 4.28509 14.7152 3.78494 14.2151C3.28478 13.7149 3.00263 13.0373 3 12.33V5.67C3.00263 4.96268 3.28478 4.28509 3.78494 3.78494C4.28509 3.28478 4.96268 3.00263 5.67 3H12.33C13.0373 3.00263 13.7149 3.28478 14.2151 3.78494C14.7152 4.28509 14.9974 4.96268 15 5.67V9.4H13V5.67C13 5.49231 12.9294 5.32189 12.8038 5.19624C12.6781 5.07059 12.5077 5 12.33 5H5.67C5.49231 5 5.32189 5.07059 5.19624 5.19624C5.07059 5.32189 5 5.49231 5 5.67V12.33C5 12.5077 5.07059 12.6781 5.19624 12.8038C5.32189 12.9294 5.49231 13 5.67 13H9.73V15Z" fill="#C7C7C7"/>
            </svg>
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
    const titleInputElement = this.containerElement.querySelector('#title-input') as HTMLInputElement;
    const descriptionInputElement = this.containerElement.querySelector('#description-input') as HTMLInputElement;
    const textInputElement = this.containerElement.querySelector('#text-input') as HTMLInputElement;
    const allowShowingFirstLettersCheckboxElement = this.containerElement.querySelector(
      '#allow-showing-first-letters-checkbox',
    ) as HTMLInputElement;
    const allowShowingTextCheckboxElement = this.containerElement.querySelector(
      '#allow-showing-text-checkbox',
    ) as HTMLInputElement;
    const generateUrlButtonElement = this.containerElement.querySelector('#generate-url-button') as HTMLButtonElement;
    const errorElement = this.containerElement.querySelector('#generate-url-error') as HTMLButtonElement;
    const generatedUrlContainerElement = this.containerElement.querySelector('#generated-url-container') as HTMLElement;
    const generatedUrlElement = this.containerElement.querySelector('#generated-url') as HTMLAnchorElement;
    const copyGeneratedUrlButtonElement = this.containerElement.querySelector(
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

    limitLength(titleInputElement, 500);
    limitLength(descriptionInputElement, 4000);
    limitLength(textInputElement, 4000);
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

    this.removeCopiedAlert();
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

      createText(this.getValues())
        .then((apiText) => {
          this.cleanForm();

          this.generatedUrl = generateTextUrl(apiText);

          generatedUrlContainerElement.classList.remove('hide');

          generatedUrlElement.innerText = this.generatedUrl;
          generatedUrlElement.href = this.generatedUrl;
        })
        .catch((error: Error) => {
          console.error(error);
          errorElement.classList.remove('hide');
          errorElement.innerText = error.message;
        })
        .finally(() => {
          this.blockForm(false);
        });
    });
  }

  private removeCopiedAlert() {
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
        this.removeCopiedAlert();
      }, 5000);
    });
  }
}
