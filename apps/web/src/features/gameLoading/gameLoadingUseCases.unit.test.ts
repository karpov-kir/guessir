import { beforeEach, describe, expect, it } from "vitest";

import { FakeApi } from "#tests/utils/fakeApi.js";
import { LocalGame } from "#src/entities/game/exports.js";
import { newGameLoadingUseCases } from "./gameLoadingUseCases";
import { RemoteGame } from "./RemoteGame";

let api: FakeApi;

describe("GameLoadingUseCases.load", () => {
  beforeEach(() => {
    api = new FakeApi();
  });

  it("should load the remote text the query string names", async () => {
    api.storeText(
      { title: "Title", text: "One", allowShowingFirstLetters: true, allowShowingText: false },
      "text-id",
    );

    const game = await newGameLoadingUseCases({ api }).load("?textId=text-id");

    expect(api.requests).toEqual([{ method: "GET", path: "texts/text-id" }]);
    expect(game).toBeInstanceOf(RemoteGame);
    expect(game.skeleton).toEqual({
      title: "Title",
      allowShowingFirstLetters: true,
      allowShowingText: false,
      wordCount: 1,
      lexemes: [{ index: 0, length: 3 }],
    });
  });

  it("should give an error text if loading the remote text fails", async () => {
    // The fake API stores no text, so it answers the load with a 404.
    const game = await newGameLoadingUseCases({ api }).load("?textId=text-id");

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
    const game = await newGameLoadingUseCases({ api }).load("");

    expect(api.requests).toEqual([]);
    expect(game).toBeInstanceOf(LocalGame);
    expect(game.skeleton.title).toBe("Hello!");
    await expect(game.guess("order")).resolves.toEqual([{ index: 2, word: "order" }]);
  });
});
