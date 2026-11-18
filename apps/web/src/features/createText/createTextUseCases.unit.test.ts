import { beforeEach, describe, expect, it, vi } from "vitest";

import { FakeApi } from "../../../tests/utils/fakeApi";
import { FakeClipboard } from "../../../tests/utils/fakeClipboard";
import { newManualClock } from "../../../tests/utils/manualClock";
import { recordTrackedEvents } from "../../../tests/utils/trackedEvents";
import { CreateTextUseCases, newCreateTextUseCases } from "./createTextUseCases";
import { getElements } from "./formElements";

let api: FakeApi;
let clipboard: FakeClipboard;
let useCases: CreateTextUseCases;
let time: ReturnType<typeof newManualClock>;
let trackedEvents: ReturnType<typeof recordTrackedEvents>;

const createText = async () => {
  const {
    textInputElement,
    titleInputElement,
    descriptionInputElement,
    allowShowingFirstLettersCheckboxElement,
    generateUrlButtonElement,
  } = getElements(useCases.getElement());

  textInputElement.value = "Text text";
  titleInputElement.value = "Test title";
  descriptionInputElement.value = "Test description";
  allowShowingFirstLettersCheckboxElement.checked = false;

  generateUrlButtonElement.click();
  await vi.waitFor(() =>
    expect(getElements(useCases.getElement()).generatedUrlContainerElement.classList).not.toContain(
      "hide",
    ),
  );
};

describe(CreateTextUseCases, () => {
  beforeEach(() => {
    api = new FakeApi();
    clipboard = new FakeClipboard();
    time = newManualClock();
    trackedEvents = recordTrackedEvents();
    useCases = newCreateTextUseCases({
      api,
      origin: "http://localhost:3000",
      clipboard,
      clock: time.clock,
      maxTitleLength: 2,
      maxDescriptionLength: 2,
      maxTextLength: 2,
    });
  });

  it("should create a text when the form is submitted", async () => {
    const { generatedUrlElement, generatedUrlContainerElement } = getElements(
      useCases.getElement(),
    );

    expect(generatedUrlContainerElement.classList).toContain("hide");

    await createText();

    expect(api.texts).toEqual(
      new Map([
        [
          "text-1",
          {
            allowShowingFirstLetters: false,
            allowShowingText: true,
            description: "Test description",
            text: "Text text",
            title: "Test title",
          },
        ],
      ]),
    );
    expect(generatedUrlElement.textContent).toBe("http://localhost:3000?textId=text-1");
    expect(generatedUrlElement.href).toBe("http://localhost:3000/?textId=text-1");
    expect(generatedUrlContainerElement.classList).not.toContain("hide");
    expect(trackedEvents).toEqual([{ name: "text_created" }]);
  });

  it("should reset the length counters after a text is created", async () => {
    const { titleInputElement } = getElements(useCases.getElement());
    const getTitleLimitText = () =>
      titleInputElement.parentElement?.querySelector(".limit-text")?.textContent;

    titleInputElement.value = "ab";
    titleInputElement.dispatchEvent(new Event("input"));
    expect(getTitleLimitText()).toBe("2/2");

    await createText();

    expect(getTitleLimitText()).toBe("0/2");
  });

  it("should render an error if text creation fails", async () => {
    const { errorElement, generateUrlButtonElement, textInputElement, titleInputElement } =
      getElements(useCases.getElement());

    api.failNextRequest(new Error("Test error"));

    // The renderer submits the form only when the title and the text are set.
    textInputElement.value = "Text text";
    titleInputElement.value = "Test title";

    expect(errorElement.classList).toContain("hide");

    generateUrlButtonElement.click();

    await vi.waitFor(() => expect(errorElement.textContent).toBe("Test error"));
    expect(errorElement.classList).not.toContain("hide");
    expect(trackedEvents).toEqual([]);
  });

  it("should render a fallback error if text creation fails with something other than an Error", async () => {
    const { errorElement, generateUrlButtonElement, textInputElement, titleInputElement } =
      getElements(useCases.getElement());

    api.failNextRequest("Test error");
    textInputElement.value = "Text text";
    titleInputElement.value = "Test title";

    generateUrlButtonElement.click();

    await vi.waitFor(() => expect(errorElement.textContent).toBe("Could not create the text"));
  });

  it("should disable form while a request is executing", async () => {
    const { textInputElement, titleInputElement, generateUrlButtonElement } = getElements(
      useCases.getElement(),
    );
    const containerElement = useCases.getElement();
    const getDisabledElements = () =>
      containerElement.querySelectorAll("input:disabled, textarea:disabled");

    // The renderer submits the form only when the title and the text are set.
    textInputElement.value = "Text text";
    titleInputElement.value = "Test title";

    expect(getDisabledElements()).toHaveLength(0);

    generateUrlButtonElement.click();

    // The fake API answers in a later microtask, so the request is still open here.
    expect(getDisabledElements()).toHaveLength(5);

    await vi.waitFor(() => expect(getDisabledElements()).toHaveLength(0));
  });

  it("should not submit an invalid form", () => {
    const { generateUrlButtonElement } = getElements(useCases.getElement());

    generateUrlButtonElement.click();

    expect(api.requests).toEqual([]);
  });

  it("should mark empty required fields invalid on submit, for screen readers too", () => {
    const { textInputElement, titleInputElement, generateUrlButtonElement } = getElements(
      useCases.getElement(),
    );

    expect(titleInputElement.classList).not.toContain("invalid");
    expect(textInputElement.classList).not.toContain("invalid");

    generateUrlButtonElement.click();

    expect(titleInputElement.classList).toContain("invalid");
    expect(textInputElement.classList).toContain("invalid");

    expect(titleInputElement.getAttribute("aria-invalid")).toBe("true");
    expect(textInputElement.getAttribute("aria-invalid")).toBe("true");

    titleInputElement.value = "ab";
    titleInputElement.dispatchEvent(new Event("input"));

    expect(titleInputElement.getAttribute("aria-invalid")).toBe("false");
    expect(textInputElement.getAttribute("aria-invalid")).toBe("true");
  });

  it("should validate inputs on input", () => {
    const { textInputElement, titleInputElement } = getElements(useCases.getElement());

    titleInputElement.dispatchEvent(new Event("input"));
    textInputElement.dispatchEvent(new Event("input"));

    expect(titleInputElement.classList).toContain("invalid");
    expect(textInputElement.classList).toContain("invalid");
  });

  it("should limit inputs length", () => {
    const { textInputElement, titleInputElement, descriptionInputElement } = getElements(
      useCases.getElement(),
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
      useCases.getElement(),
    );

    [textInputElement, titleInputElement, descriptionInputElement].forEach((element) => {
      element.value = "\u{1F600}\u{1F600}\u{1F600}";
      element.dispatchEvent(new Event("input"));

      expect(element.value).toBe("\u{1F600}\u{1F600}");
      expect(element.parentElement?.querySelector(".limit-text")?.textContent).toBe("2/2");
    });
  });

  it("should copy a generated URL on click", async () => {
    const { copyGeneratedUrlButtonElement } = getElements(useCases.getElement());

    await createText();
    copyGeneratedUrlButtonElement.click();

    expect(clipboard.text).toBe("http://localhost:3000?textId=text-1");
    expect(trackedEvents).toEqual([{ name: "text_created" }, { name: "game_link_copied" }]);
  });

  it("should hide the alert that a generated URL was copied 5 seconds after the last copy", async () => {
    const { copyGeneratedUrlButtonElement } = getElements(useCases.getElement());
    const alert = () => copyGeneratedUrlButtonElement.querySelector("div")?.textContent;

    await createText();
    copyGeneratedUrlButtonElement.click();
    time.advance(4_000);
    copyGeneratedUrlButtonElement.click();
    time.advance(4_999);

    expect(alert()).toBe("(copied)");

    time.advance(1);

    expect(alert()).toBeUndefined();
  });
});
