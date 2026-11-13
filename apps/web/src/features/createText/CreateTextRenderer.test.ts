import { CreateTextDtoResponse, createTextDtoResponseSchema } from "@guessir/game";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";

import { CreateTextApi } from "./createTextApi";
import { Logger, LogLevel } from "../../shared/Logger";
import { CreateTextRenderer, getElements } from "./CreateTextRenderer";

// Silences the logger: these tests make creating a text fail on purpose.
Logger.root.setLevel(LogLevel.Silent);

const mockedText = {
  id: "mocked-id",
};
let httpClient: MockProxy<CreateTextApi>;
const clipboard = { writeText: vi.fn<(text: string) => Promise<void>>() };
let createTextRenderer: CreateTextRenderer;

const createText = async () => {
  const {
    textInputElement,
    titleInputElement,
    descriptionInputElement,
    allowShowingFirstLettersCheckboxElement,
    generateUrlButtonElement,
  } = getElements(createTextRenderer.getElement());
  const deferred = Promise.withResolvers<CreateTextDtoResponse>();

  httpClient.post.mockReturnValue(deferred.promise);

  textInputElement.value = "Text text";
  titleInputElement.value = "Test title";
  descriptionInputElement.value = "Test description";
  allowShowingFirstLettersCheckboxElement.checked = false;

  generateUrlButtonElement.click();
  deferred.resolve(mockedText);
  await vi.waitFor(() =>
    expect(
      getElements(createTextRenderer.getElement()).generatedUrlContainerElement.classList,
    ).not.toContain("hide"),
  );
};

describe(CreateTextRenderer, () => {
  beforeEach(() => {
    vi.useRealTimers();

    httpClient = mock<CreateTextApi>();
    clipboard.writeText.mockReset();
    createTextRenderer = new CreateTextRenderer({
      httpClient,
      origin: "http://localhost:3000",
      clipboard,
      maxTitleLength: 2,
      maxDescriptionLength: 2,
      maxTextLength: 2,
    });
  });

  it("should create a text when the form is submitted", async () => {
    const { generatedUrlElement, generatedUrlContainerElement } = getElements(
      createTextRenderer.getElement(),
    );

    expect(generatedUrlContainerElement.classList).toContain("hide");

    await createText();

    expect(httpClient.post).toHaveBeenCalledWith(
      "texts",
      {
        allowShowingFirstLetters: false,
        allowShowingText: true,
        description: "Test description",
        text: "Text text",
        title: "Test title",
      },
      createTextDtoResponseSchema,
    );
    expect(generatedUrlElement.textContent).toBe("http://localhost:3000?textId=mocked-id");
    expect(generatedUrlElement.href).toBe("http://localhost:3000/?textId=mocked-id");
    expect(generatedUrlContainerElement.classList).not.toContain("hide");
  });

  it("should reset the length counters after a text is created", async () => {
    const { titleInputElement } = getElements(createTextRenderer.getElement());
    const getTitleLimitText = () =>
      titleInputElement.parentElement?.querySelector(".limit-text")?.textContent;

    titleInputElement.value = "ab";
    titleInputElement.dispatchEvent(new Event("input"));
    expect(getTitleLimitText()).toBe("2/2");

    await createText();

    expect(getTitleLimitText()).toBe("0/2");
  });

  it("should render an error if text creation fails", async () => {
    const deferred = Promise.withResolvers<CreateTextDtoResponse>();
    const { errorElement, generateUrlButtonElement, textInputElement, titleInputElement } =
      getElements(createTextRenderer.getElement());

    httpClient.post.mockReturnValue(deferred.promise);

    // The renderer submits the form only when the title and the text are set.
    textInputElement.value = "Text text";
    titleInputElement.value = "Test title";

    expect(errorElement.classList).toContain("hide");

    generateUrlButtonElement.click();
    deferred.reject(new Error("Test error"));

    await vi.waitFor(() => expect(errorElement.textContent).toBe("Test error"));
    expect(errorElement.classList).not.toContain("hide");
  });

  it("should render a fallback error if text creation fails with something other than an Error", async () => {
    const deferred = Promise.withResolvers<CreateTextDtoResponse>();
    const { errorElement, generateUrlButtonElement, textInputElement, titleInputElement } =
      getElements(createTextRenderer.getElement());

    httpClient.post.mockReturnValue(deferred.promise);
    textInputElement.value = "Text text";
    titleInputElement.value = "Test title";

    generateUrlButtonElement.click();
    deferred.reject("Test error");

    await vi.waitFor(() => expect(errorElement.textContent).toBe("Could not create the text"));
  });

  it("should disable form while a request is executing", async () => {
    const deferred = Promise.withResolvers<CreateTextDtoResponse>();
    const { textInputElement, titleInputElement, generateUrlButtonElement } = getElements(
      createTextRenderer.getElement(),
    );
    const containerElement = createTextRenderer.getElement();
    const getDisabledElements = () =>
      containerElement.querySelectorAll("input:disabled, textarea:disabled");

    httpClient.post.mockReturnValue(deferred.promise);

    // The renderer submits the form only when the title and the text are set.
    textInputElement.value = "Text text";
    titleInputElement.value = "Test title";

    expect(getDisabledElements()).toHaveLength(0);

    generateUrlButtonElement.click();

    expect(getDisabledElements()).toHaveLength(5);

    deferred.resolve(mockedText);

    await vi.waitFor(() => expect(getDisabledElements()).toHaveLength(0));
  });

  it("should not submit an invalid form", () => {
    const { generateUrlButtonElement } = getElements(createTextRenderer.getElement());

    generateUrlButtonElement.click();

    expect(httpClient.post).not.toHaveBeenCalled();
  });

  it("should initialize inputs without validation classes", () => {
    const { textInputElement, titleInputElement } = getElements(createTextRenderer.getElement());

    expect(titleInputElement.classList).not.toContain("invalid");
    expect(textInputElement.classList).not.toContain("invalid");
  });

  it("should validate inputs on submit", () => {
    const { textInputElement, titleInputElement, generateUrlButtonElement } = getElements(
      createTextRenderer.getElement(),
    );

    generateUrlButtonElement.click();

    expect(titleInputElement.classList).toContain("invalid");
    expect(textInputElement.classList).toContain("invalid");
  });

  it("should mark empty required fields invalid for screen readers too", () => {
    const { textInputElement, titleInputElement, generateUrlButtonElement } = getElements(
      createTextRenderer.getElement(),
    );

    generateUrlButtonElement.click();

    expect(titleInputElement.getAttribute("aria-invalid")).toBe("true");
    expect(textInputElement.getAttribute("aria-invalid")).toBe("true");

    titleInputElement.value = "ab";
    titleInputElement.dispatchEvent(new Event("input"));

    expect(titleInputElement.getAttribute("aria-invalid")).toBe("false");
    expect(textInputElement.getAttribute("aria-invalid")).toBe("true");
  });

  it("should validate inputs on input", () => {
    const { textInputElement, titleInputElement } = getElements(createTextRenderer.getElement());

    titleInputElement.dispatchEvent(new Event("input"));
    textInputElement.dispatchEvent(new Event("input"));

    expect(titleInputElement.classList).toContain("invalid");
    expect(textInputElement.classList).toContain("invalid");
  });

  it("should limit inputs length", () => {
    const { textInputElement, titleInputElement, descriptionInputElement } = getElements(
      createTextRenderer.getElement(),
    );
    const elements = [textInputElement, titleInputElement, descriptionInputElement];

    elements.forEach((element) => {
      element.value = "  asd  ";
      element.dispatchEvent(new Event("input"));

      expect(element.parentElement?.querySelector(".limit-text")?.textContent).toBe("2/2");
    });
  });

  it("should count and cut inputs in code points, as the server counts them", () => {
    const { textInputElement, titleInputElement, descriptionInputElement } = getElements(
      createTextRenderer.getElement(),
    );

    [textInputElement, titleInputElement, descriptionInputElement].forEach((element) => {
      element.value = "\u{1F600}\u{1F600}\u{1F600}";
      element.dispatchEvent(new Event("input"));

      expect(element.value).toBe("\u{1F600}\u{1F600}");
      expect(element.parentElement?.querySelector(".limit-text")?.textContent).toBe("2/2");
    });
  });

  it("should copy a generated URL on click", async () => {
    const { copyGeneratedUrlButtonElement } = getElements(createTextRenderer.getElement());

    await createText();
    copyGeneratedUrlButtonElement.click();

    expect(clipboard.writeText).toHaveBeenCalledWith("http://localhost:3000?textId=mocked-id");
  });

  it("should hide the alert that a generated URL was copied on a timeout", async () => {
    const { copyGeneratedUrlButtonElement } = getElements(createTextRenderer.getElement());

    vi.useFakeTimers();

    await createText();
    copyGeneratedUrlButtonElement.click();

    expect(copyGeneratedUrlButtonElement.querySelector("div")?.textContent).toBe("(copied)");

    vi.runAllTimers();

    expect(copyGeneratedUrlButtonElement.querySelector("div")).toBe(null);
  });
});
