import { describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";

import { GameApi } from "../../features/gameLoading/exports";
import { compose } from "./compositionRoot";

describe(compose, () => {
  it("should wire the theme toggle and render the game page", async () => {
    const body = document.createElement("div");
    const themeButton = document.createElement("button");

    await compose({
      api: mock<GameApi>(),
      location: { origin: "https://guessir.test", search: "" },
      clipboard: { writeText: vi.fn<(text: string) => Promise<void>>() },
      storage: () => mock<Storage>(),
      systemTheme: { matches: true, addEventListener: vi.fn<() => void>() },
    }).mount({ body, themeButton });

    expect(themeButton.getAttribute("aria-pressed")).toBe("true");
    expect(body.querySelector("main#guessir #game")).not.toBeNull();
  });
});
