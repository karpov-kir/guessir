import { requireElement } from "#src/shared/dom.js";

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
