import { textSkeletonSchema } from "@guessir/game";
import { describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";

import { getElementText } from "../../utils/dom";
import { newManualClock } from "../../utils/manualClock";
import { newTextSkeleton } from "../../utils/textSkeleton";
import { CreateTextApi } from "../../../src/features/createText/exports";
import { GameApi } from "../../../src/features/gameLoading/exports";
import { mountGamePage } from "../../../src/orchestration/gamePage/exports";

const clipboard = { writeText: vi.fn<(text: string) => Promise<void>>() };

describe(mountGamePage, () => {
  it("should render the game into the page's main column, with the create-text form below it", async () => {
    const container = document.createElement("div");

    await mountGamePage(container, {
      api: mock<GameApi & CreateTextApi>(),
      location: { origin: "https://guessir.test", search: "" },
      clipboard,
      clock: newManualClock().clock,
    });

    const mainElement = container.querySelector("main#guessir");

    expect(mainElement?.firstElementChild?.id).toBe("game");
    expect(mainElement?.lastElementChild?.id).toBe("utils-container");
  });

  it("should load the text the page URL names and render its title", async () => {
    const container = document.createElement("div");
    const api = mock<GameApi & CreateTextApi>();
    const skeleton = newTextSkeleton();

    api.get.mockResolvedValue(skeleton);

    await mountGamePage(container, {
      api,
      location: { origin: "https://guessir.test", search: "?textId=text-id" },
      clipboard,
      clock: newManualClock().clock,
    });

    expect(api.get).toHaveBeenCalledWith("texts/text-id", textSkeletonSchema);
    expect(getElementText(container, "#game #title")).toBe(skeleton.title);
  });
});
