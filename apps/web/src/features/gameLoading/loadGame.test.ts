import { textSkeletonSchema } from "@guessir/game";
import { beforeEach, describe, expect, it } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";

import { newTextSkeleton } from "../../../tests/utils/textSkeleton";
import { LocalGame } from "../../entities/game/exports";
import { Logger, LogLevel } from "../../shared/Logger";
import { GameApi } from "./GameApi";
import { loadGame } from "./loadGame";
import { RemoteGame } from "./RemoteGame";

// Silences the logger: these tests make loading fail on purpose.
Logger.root.setLevel(LogLevel.Silent);

const skeleton = newTextSkeleton();
let api: MockProxy<GameApi>;

describe(loadGame, () => {
  beforeEach(() => {
    api = mock<GameApi>();
  });

  it("should load the remote text the query string names", async () => {
    api.get.mockResolvedValue(skeleton);

    const game = await loadGame({ api, search: "?textId=text-id" });

    expect(api.get).toHaveBeenCalledWith("texts/text-id", textSkeletonSchema);
    expect(game).toBeInstanceOf(RemoteGame);
    expect(game.skeleton).toEqual(skeleton);
  });

  it("should give an error text if loading the remote text fails", async () => {
    api.get.mockRejectedValue(new Error("Test"));

    const game = await loadGame({ api, search: "?textId=text-id" });

    expect(game).toBeInstanceOf(LocalGame);
    expect(game.skeleton).toEqual(
      expect.objectContaining({
        title: "Hello!",
        description: "I am a simple tool to turn any English text into a word guessing game.",
        allowShowingFirstLetters: true,
        allowShowingText: true,
      }),
    );
    await expect(game.words()).resolves.toEqual(
      expect.arrayContaining([
        { index: 0, word: "I" },
        expect.objectContaining({ word: "remote" }),
      ]),
    );
  });

  it("should give the default text if the query string names no text", async () => {
    const game = await loadGame({ api, search: "" });

    expect(api.get).not.toHaveBeenCalled();
    expect(game).toBeInstanceOf(LocalGame);
    expect(game.skeleton.title).toBe("Hello!");
    await expect(game.guess("order")).resolves.toEqual([{ index: 2, word: "order" }]);
  });
});
