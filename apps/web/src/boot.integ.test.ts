import { textSkeletonSchema } from "@guessir/game";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";

import { newTextSkeleton } from "../tests/utils/textSkeleton";
import { boot, BootDependencies } from "./boot";
import { Game } from "./game/Game";
import { LocalGame } from "./game/LocalGame";
import { RemoteGame } from "./game/RemoteGame";
import { RenderController } from "./RenderController";
import { HttpClient } from "./utils/HttpClient";
import { Logger, LogLevel } from "./shared/Logger";

// Silences the logger: these tests make loading fail on purpose.
Logger.root.setLevel(LogLevel.Silent);

vi.mock("./RenderController");

const textId = "text-id";
const skeleton = newTextSkeleton();
let httpClient: MockProxy<HttpClient>;
let containerElement: HTMLElement;

const bootWith = (search: string) => {
  const dependencies: BootDependencies = {
    httpClient,
    location: { origin: "https://guessir.test", search },
    clipboard: { writeText: vi.fn<(text: string) => Promise<void>>() },
  };

  return boot(containerElement, dependencies);
};

const getRenderedGame = (): Game => {
  const options = vi.mocked(RenderController).mock.lastCall?.[0];

  if (!options) {
    throw new Error("RenderController was not created");
  }

  return options.game;
};

describe(boot, () => {
  beforeEach(() => {
    httpClient = mock<HttpClient>();
    containerElement = document.createElement("div");
  });

  it("should load and render a remote text", async () => {
    httpClient.get.mockResolvedValue(skeleton);

    await bootWith(`?textId=${textId}`);

    expect(httpClient.get).toHaveBeenCalledWith(`texts/${textId}`, textSkeletonSchema);
    expect(getRenderedGame()).toBeInstanceOf(RemoteGame);
    expect(getRenderedGame().skeleton).toEqual(skeleton);
  });

  it("should render an error text if loading a remote text fails", async () => {
    httpClient.get.mockRejectedValue(new Error("Test"));

    await bootWith(`?textId=${textId}`);

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
    await bootWith("");

    expect(httpClient.get).not.toHaveBeenCalled();
    expect(getRenderedGame()).toBeInstanceOf(LocalGame);
    expect(getRenderedGame().skeleton.title).toBe("Hello!");
    await expect(getRenderedGame().guess("order")).resolves.toEqual([{ index: 2, word: "order" }]);
  });

  it("should render the game into the page's main column with the create-text form", async () => {
    const init = vi.spyOn(RenderController.prototype, "init");

    await bootWith("");

    const mainElement = containerElement.querySelector("main#guessir");

    expect(init).toHaveBeenCalledWith(mainElement);
    expect(mainElement?.lastElementChild?.id).toBe("utils-container");
  });
});
