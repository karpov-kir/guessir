import { beforeEach, describe, expect, it } from "vitest";

import { fakeIds } from "../../../tests/utils/fakeIds.js";
import { fakeTextRows } from "../../../tests/utils/fakeTextRows.js";
import {
  HintNotAllowedError,
  Text,
  TextNotFoundError,
  Texts,
  WordNotFoundError,
} from "./exports.js";

const text = {
  id: "id",
  title: "Title",
  description: "Description",
  text: "One, two one",
  allowShowingFirstLetters: true,
  allowShowingText: true,
} satisfies Text;

describe(Texts, () => {
  let rows: ReturnType<typeof fakeTextRows>;
  let texts: Texts;

  /** Stores `text` with `overrides` under its id. */
  const storeText = (overrides: Partial<Text> = {}) => {
    rows = fakeTextRows([{ ...text, ...overrides }]);
    texts = new Texts({ rows, ids: fakeIds() });
  };

  beforeEach(() => storeText());

  it("should return the skeleton of the text without its letters", async () => {
    expect(await texts.findSkeleton("id")).toEqual({
      title: "Title",
      description: "Description",
      allowShowingFirstLetters: true,
      allowShowingText: true,
      wordCount: 3,
      lexemes: [
        { index: 0, length: 3 },
        { index: 1, character: "," },
        { index: 2, character: " " },
        { index: 3, length: 3 },
        { index: 4, character: " " },
        { index: 5, length: 3 },
      ],
    });
  });

  it("should pass on a failed read", async () => {
    rows.getById.mockRejectedValue(new Error("Test"));

    await expect(texts.findSkeleton("id")).rejects.toEqual(new Error("Test"));
  });

  it("should return every word the guess opens", async () => {
    expect(await texts.guess("id", "ONE")).toEqual({
      words: [
        { index: 0, word: "One" },
        { index: 5, word: "one" },
      ],
    });
  });

  it("should return no words for a miss", async () => {
    expect(await texts.guess("id", "three")).toEqual({ words: [] });
  });

  it("should return the word at the index", async () => {
    expect(await texts.reveal("id", 3)).toEqual({ index: 3, word: "two" });
  });

  it.each([1, 6])("should refuse the index %i, which holds no word", async (index) => {
    await expect(texts.reveal("id", index)).rejects.toBeInstanceOf(WordNotFoundError);
  });

  it("should return the first letter of every word", async () => {
    expect(await texts.firstLetters("id")).toEqual({
      words: [
        { index: 0, word: "O" },
        { index: 3, word: "t" },
        { index: 5, word: "o" },
      ],
    });
  });

  it("should refuse first letters when the text does not allow them", async () => {
    storeText({ allowShowingFirstLetters: false });

    await expect(texts.firstLetters("id")).rejects.toBeInstanceOf(HintNotAllowedError);
  });

  it("should return every word", async () => {
    expect(await texts.words("id")).toEqual({
      words: [
        { index: 0, word: "One" },
        { index: 3, word: "two" },
        { index: 5, word: "one" },
      ],
    });
  });

  it("should refuse the words when the text does not allow showing it", async () => {
    storeText({ allowShowingText: false });

    await expect(texts.words("id")).rejects.toBeInstanceOf(HintNotAllowedError);
  });

  it.each([
    { move: "findSkeleton", call: () => texts.findSkeleton("unknown") },
    { move: "guess", call: () => texts.guess("unknown", "one") },
    { move: "reveal", call: () => texts.reveal("unknown", 0) },
    { move: "firstLetters", call: () => texts.firstLetters("unknown") },
    { move: "words", call: () => texts.words("unknown") },
  ])("$move should refuse an unknown text", async ({ call }) => {
    await expect(call()).rejects.toBeInstanceOf(TextNotFoundError);
  });

  describe("cache", () => {
    it("should read a text once for repeated moves on it", async () => {
      await texts.findSkeleton("id");
      await texts.guess("id", "one");
      await texts.words("id");

      expect(rows.getById).toHaveBeenCalledTimes(1);
    });

    it("should read again for an unknown text", async () => {
      await expect(texts.findSkeleton("unknown")).rejects.toBeInstanceOf(TextNotFoundError);
      await expect(texts.findSkeleton("unknown")).rejects.toBeInstanceOf(TextNotFoundError);

      expect(rows.getById).toHaveBeenCalledTimes(2);
    });

    it("should keep a bounded number of texts and read again one it dropped", async () => {
      rows.getById.mockImplementation(async (id) => ({ ...text, id }));

      // The test plays more texts than the cache keeps. The cache then drops `id-0`, and playing
      // it again reads it again.
      const textCount = 1000;

      for (let i = 0; i < textCount; i++) {
        await texts.findSkeleton(`id-${i}`);
      }

      await texts.findSkeleton("id-0");

      expect(rows.getById).toHaveBeenCalledTimes(textCount + 1);
    });
  });
});

describe("Texts.create", () => {
  it("should store the text under a new 20-character id and return only the id", async () => {
    const rows = fakeTextRows();
    const { id } = await new Texts({ rows, ids: fakeIds() }).create({
      title: "Title",
      text: "One",
      allowShowingFirstLetters: true,
      allowShowingText: false,
    });

    expect(id).toBe("id100000000000000000");
    expect(await rows.getById(id)).toEqual({
      id,
      title: "Title",
      text: "One",
      allowShowingFirstLetters: true,
      allowShowingText: false,
    });
  });
});
