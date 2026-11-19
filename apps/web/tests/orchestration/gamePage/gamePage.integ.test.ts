import { describe, expect, it } from "vitest";

import { getElementText } from "../../utils/dom";
import { FakeApi } from "../../utils/fakeApi";
import { FakeClipboard } from "../../utils/fakeClipboard";
import { newManualClock } from "../../utils/manualClock";
import { mountGamePage } from "../../../src/orchestration/gamePage/exports";

describe(mountGamePage, () => {
  it("should render the game into the page's main column, with the create-text form below it", async () => {
    const container = document.createElement("div");

    await mountGamePage(container, {
      api: new FakeApi(),
      location: { origin: "https://guessir.test", search: "" },
      clipboard: new FakeClipboard(),
      clock: newManualClock().clock,
    });

    const mainElement = container.querySelector("main#guessir");

    expect(mainElement?.firstElementChild?.id).toBe("game");
    expect(mainElement?.lastElementChild?.id).toBe("utils-container");
  });

  it("should load the text the page URL names and render its title", async () => {
    const container = document.createElement("div");
    const api = new FakeApi();

    api.storeText(
      {
        title: "Stored title",
        text: "One",
        allowShowingFirstLetters: true,
        allowShowingText: true,
      },
      "text-id",
    );

    await mountGamePage(container, {
      api,
      location: { origin: "https://guessir.test", search: "?textId=text-id" },
      clipboard: new FakeClipboard(),
      clock: newManualClock().clock,
    });

    expect(api.requests).toEqual([{ method: "GET", path: "texts/text-id" }]);
    expect(getElementText(container, "#game #title")).toBe("Stored title");
  });
});
