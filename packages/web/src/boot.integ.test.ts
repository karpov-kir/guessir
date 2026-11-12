import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";

import { newTextSkeleton } from "../tests/utils/textSkeleton";
import { boot } from "./boot";
import { Game } from "./game/Game";
import { LocalGame } from "./game/LocalGame";
import { RemoteGame } from "./game/RemoteGame";
import { RenderController } from "./RenderController";
import { ApiClient } from "./utils/ApiClient";
import { HttpClient } from "./utils/HttpClient";
import { Logger, LogLevel } from "./utils/Logger";

// Silences the logger: these tests make loading fail on purpose.
Logger.root.setLevel(LogLevel.Silent);

let mockedApiClient: MockProxy<ApiClient>;
vi.mock("./RenderController");

const textId = "text-id";
const skeleton = newTextSkeleton();

Object.defineProperty(window, "location", {
  value: {
    search: `?textId=${textId}`,
  },
});

const getRenderedGame = (): Game => {
  const options = vi.mocked(RenderController).mock.lastCall?.[0];

  if (!options) {
    throw new Error("RenderController was not created");
  }

  return options.game;
};

describe(boot, () => {
  beforeEach(() => {
    mockedApiClient = mock<ApiClient>();
  });

  it("should load and render a remote text", async () => {
    const remoteGame = new RemoteGame({
      httpClient: mock<HttpClient>(),
      textUrl: "texts/text-id",
      skeleton,
    });

    mockedApiClient.loadGame.mockResolvedValue(remoteGame);

    await boot(document.createElement("div"), mockedApiClient);

    expect(mockedApiClient.loadGame).toBeCalledWith(textId);
    expect(getRenderedGame()).toBe(remoteGame);
  });

  it("should render an error text if loading a remote text fails", async () => {
    mockedApiClient.loadGame.mockRejectedValue(new Error("Test"));

    await boot(document.createElement("div"), mockedApiClient);

    expect(getRenderedGame()).toBeInstanceOf(LocalGame);
    expect(getRenderedGame().skeleton).toEqual(
      expect.objectContaining({
        title: "Hello!",
        description: "I am a simple tool to turn any English text into a word guessing game.",
        allowShowingFirstLetters: true,
        allowShowingText: true,
      }),
    );
    await expect(getRenderedGame().words()).resolves.toEqual(
      expect.arrayContaining([
        { index: 0, word: "I" },
        expect.objectContaining({ word: "remote" }),
      ]),
    );
  });

  it("should render a default text if a text ID is not set in the URL", async () => {
    window.location.search = "";

    await boot(document.createElement("div"), mockedApiClient);

    expect(mockedApiClient.loadGame).not.toBeCalled();
    expect(getRenderedGame()).toBeInstanceOf(LocalGame);
    expect(getRenderedGame().skeleton.title).toBe("Hello!");
    await expect(getRenderedGame().guess("order")).resolves.toEqual([{ index: 2, word: "order" }]);
  });
});
