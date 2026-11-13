import { revealedWordSchema, revealedWordsSchema } from "@guessir/game";
import { beforeEach, describe, expect, it } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";

import { newTextSkeleton } from "../../../tests/utils/textSkeleton";
import { GameApi } from "./GameApi";
import { RemoteGame } from "./RemoteGame";

const textPath = "texts/text-id";
const skeleton = newTextSkeleton();
const words = [{ index: 0, word: "One" }];
let api: MockProxy<GameApi>;
let remoteGame: RemoteGame;

describe(RemoteGame, () => {
  beforeEach(() => {
    api = mock<GameApi>();
    remoteGame = new RemoteGame({ api, textPath, skeleton });
  });

  it("should keep the skeleton", () => {
    expect(remoteGame.skeleton).toBe(skeleton);
  });

  it("should ask the server about a guess", async () => {
    api.post.mockResolvedValue({ words });

    await expect(remoteGame.guess("one")).resolves.toEqual(words);
    expect(api.post).toHaveBeenCalledWith(
      `${textPath}/guesses`,
      { word: "one" },
      revealedWordsSchema,
    );
  });

  it("should ask the server to reveal a word", async () => {
    api.post.mockResolvedValue(words[0]);

    await expect(remoteGame.reveal(0)).resolves.toEqual(words[0]);
    expect(api.post).toHaveBeenCalledWith(`${textPath}/reveals`, { index: 0 }, revealedWordSchema);
  });

  it("should ask the server for the first letters", async () => {
    api.get.mockResolvedValue({ words });

    await expect(remoteGame.firstLetters()).resolves.toEqual(words);
    expect(api.get).toHaveBeenCalledWith(`${textPath}/first-letters`, revealedWordsSchema);
  });

  it("should ask the server for the words", async () => {
    api.get.mockResolvedValue({ words });

    await expect(remoteGame.words()).resolves.toEqual(words);
    expect(api.get).toHaveBeenCalledWith(`${textPath}/words`, revealedWordsSchema);
  });
});
