import { beforeEach, describe, expect, it } from "vitest";

import { FakeApi } from "#tests/utils/fakeApi.js";
import { newTextSkeleton } from "#tests/utils/textSkeleton.js";
import { RemoteGame } from "./RemoteGame";

const textPath = "texts/text-id";
const skeleton = newTextSkeleton();
let api: FakeApi;
let remoteGame: RemoteGame;

describe(RemoteGame, () => {
  beforeEach(() => {
    api = new FakeApi();
    api.storeText(
      { title: "Title", text: "One, one", allowShowingFirstLetters: true, allowShowingText: true },
      "text-id",
    );
    remoteGame = new RemoteGame({ api, textPath, skeleton });
  });

  it("should keep the skeleton", () => {
    expect(remoteGame.skeleton).toBe(skeleton);
  });

  it("should ask the server about a guess", async () => {
    await expect(remoteGame.guess("one")).resolves.toEqual([
      { index: 0, word: "One" },
      { index: 3, word: "one" },
    ]);
    expect(api.requests).toEqual([{ method: "POST", path: `${textPath}/guesses` }]);
  });

  it("should ask the server to reveal a word", async () => {
    await expect(remoteGame.reveal(3)).resolves.toEqual({ index: 3, word: "one" });
    expect(api.requests).toEqual([{ method: "POST", path: `${textPath}/reveals` }]);
  });

  it("should ask the server for the first letters", async () => {
    await expect(remoteGame.firstLetters()).resolves.toEqual([
      { index: 0, word: "O" },
      { index: 3, word: "o" },
    ]);
    expect(api.requests).toEqual([{ method: "GET", path: `${textPath}/first-letters` }]);
  });

  it("should ask the server for the words", async () => {
    await expect(remoteGame.words()).resolves.toEqual([
      { index: 0, word: "One" },
      { index: 3, word: "one" },
    ]);
    expect(api.requests).toEqual([{ method: "GET", path: `${textPath}/words` }]);
  });

  it.each(["firstLetters", "words"] as const)(
    "should ask the server for %s once and answer later calls from that answer",
    async (read) => {
      const answer = await remoteGame[read]();

      await expect(remoteGame[read]()).resolves.toEqual(answer);
      expect(api.requests).toHaveLength(1);
    },
  );

  it.each(["firstLetters", "words"] as const)(
    "should ask the server for %s again after a failed read",
    async (read) => {
      api.failNextRequest(new Error("Test"));

      await expect(remoteGame[read]()).rejects.toThrow("Test");
      await expect(remoteGame[read]()).resolves.toHaveLength(2);
      expect(api.requests).toHaveLength(2);
    },
  );
});
