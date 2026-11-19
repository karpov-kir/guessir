import { revealedWordSchema, revealedWordsSchema, textSkeletonSchema } from "@guessir/game";
import { beforeEach, describe, expect, it } from "vitest";

import { FakeApi } from "./fakeApi";

let api: FakeApi;

describe(FakeApi, () => {
  beforeEach(() => {
    api = new FakeApi();
    api.storeText(
      { title: "Title", text: "One", allowShowingFirstLetters: false, allowShowingText: true },
      "a/b",
    );
  });

  it("should reject an answer that the caller's schema does not read", async () => {
    await expect(
      api.post("texts/a%2Fb/guesses", { word: "one" }, revealedWordSchema),
    ).rejects.toThrow("Unexpected response from the server");
    await expect(
      api.post("texts/a%2Fb/guesses", { word: "one" }, revealedWordsSchema),
    ).resolves.toEqual({ words: [{ index: 0, word: "One" }] });
  });

  it("should find a text only by an id kept to one path segment", async () => {
    await expect(api.get("texts/a/b", textSkeletonSchema)).rejects.toMatchObject({
      message: "Request failed",
      cause: { status: 404 },
    });
    await expect(api.get("texts/a%2Fb", textSkeletonSchema)).resolves.toHaveProperty(
      "title",
      "Title",
    );
  });

  it("should refuse a hint the text does not allow, as the backend does", async () => {
    await expect(api.get("texts/a%2Fb/first-letters", revealedWordsSchema)).rejects.toMatchObject({
      message: "Request failed",
      cause: { status: 403 },
    });
  });
});
