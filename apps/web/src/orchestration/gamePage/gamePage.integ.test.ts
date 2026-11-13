import { describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";

import { GameApi } from "../../features/gameLoading/exports";
import { mountGamePage } from "./gamePage";

describe(mountGamePage, () => {
  it("should render the game into the page's main column, with the create-text form below it", async () => {
    const container = document.createElement("div");

    await mountGamePage(container, {
      api: mock<GameApi>(),
      location: { origin: "https://guessir.test", search: "" },
      clipboard: { writeText: vi.fn<(text: string) => Promise<void>>() },
    });

    const mainElement = container.querySelector("main#guessir");

    expect(mainElement?.firstElementChild?.id).toBe("game");
    expect(mainElement?.lastElementChild?.id).toBe("utils-container");
  });
});
