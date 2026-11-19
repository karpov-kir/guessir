import { CreateTextDto } from "@guessir/game";
import { beforeEach, describe, expect, it } from "vitest";

import { FakeApi } from "../../../tests/utils/fakeApi";
import { loadRemoteGame } from "./loadRemoteGame";

const text: CreateTextDto = {
  title: "Title",
  text: "One",
  allowShowingFirstLetters: true,
  allowShowingText: true,
};
let api: FakeApi;

describe(loadRemoteGame, () => {
  beforeEach(() => {
    api = new FakeApi();
  });

  it("should load the skeleton and play the game at the same text path", async () => {
    api.storeText(text, "text-id");

    const game = await loadRemoteGame(api, "text-id");

    await expect(game.guess("one")).resolves.toEqual([{ index: 0, word: "One" }]);
    expect(game.skeleton).toEqual({
      title: "Title",
      allowShowingFirstLetters: true,
      allowShowingText: true,
      wordCount: 1,
      lexemes: [{ index: 0, length: 3 }],
    });
    expect(api.requests).toEqual([
      { method: "GET", path: "texts/text-id" },
      { method: "POST", path: "texts/text-id/guesses" },
    ]);
  });

  it("should keep an id from the page URL to one path segment", async () => {
    api.storeText(text, "../admin?x#y");

    await expect(loadRemoteGame(api, "../admin?x#y")).resolves.toHaveProperty(
      "skeleton.title",
      "Title",
    );
    expect(api.requests).toEqual([{ method: "GET", path: "texts/..%2Fadmin%3Fx%23y" }]);
  });
});
