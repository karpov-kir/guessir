import { describe, expect, it } from "vitest";

import { TextGame } from "./TextGame.js";

const textGame = new TextGame("One, she's\none!");

describe(TextGame, () => {
  it("should give the length of every word and the character of every other lexeme", () => {
    expect(textGame.lexemes()).toEqual([
      { index: 0, length: 3 },
      { index: 1, character: "," },
      { index: 2, character: " " },
      { index: 3, length: 5 },
      { index: 4, character: "\n" },
      { index: 5, length: 3 },
      { index: 6, character: "!" },
    ]);
  });

  it("should keep at most two line breaks and one space in a row, and no space before a break", () => {
    expect(new TextGame("One  \n\n\n\ntwo   three").lexemes()).toEqual([
      { index: 0, length: 3 },
      { index: 1, character: "\n" },
      { index: 2, character: "\n" },
      { index: 3, length: 3 },
      { index: 4, character: " " },
      { index: 5, length: 5 },
    ]);
  });

  it("should start the text at its first word and drop the space before punctuation and at the end", () => {
    expect(new TextGame("  ^One , two .\n ").lexemes()).toEqual([
      { index: 0, length: 3 },
      { index: 1, character: "," },
      { index: 2, character: " " },
      { index: 3, length: 3 },
      { index: 4, character: "." },
    ]);
  });

  it("should read an em dash inside a word as a hyphen and a lone i as I", () => {
    expect(new TextGame("re—g i").words()).toEqual([
      { index: 0, word: "re-g" },
      { index: 2, word: "I" },
    ]);
  });

  it("should split a contraction into its words with a space, and keep a lone hyphen out of the words", () => {
    expect(new TextGame("So don't - go").lexemes()).toEqual([
      { index: 0, length: 2 },
      { index: 1, character: " " },
      { index: 2, length: 2 },
      { index: 3, character: " " },
      { index: 4, length: 3 },
      { index: 5, character: " " },
      { index: 6, character: "-" },
      { index: 7, character: " " },
      { index: 8, length: 2 },
    ]);
  });

  it("should reveal a contraction with 'd by its first word", () => {
    expect(new TextGame("So she'd go").guess("she")).toEqual([{ index: 2, word: "she'd" }]);
  });

  it("should count the words", () => {
    expect(textGame.wordCount).toBe(3);
  });

  it("should reveal every word that matches a trimmed and lower-cased guess", () => {
    expect(textGame.guess(" ONE ")).toEqual([
      { index: 0, word: "One" },
      { index: 5, word: "one" },
    ]);
  });

  it("should reveal a contraction by its first word", () => {
    expect(textGame.guess("she")).toEqual([{ index: 3, word: "she's" }]);
  });

  it("should reveal nothing for a miss", () => {
    expect(textGame.guess("two")).toEqual([]);
  });

  it("should reveal nothing for a blank guess, even next to a bare contraction ending", () => {
    expect(new TextGame("The boy 's here").guess(" ")).toEqual([]);
  });

  it("should reveal a word by its index", () => {
    expect(textGame.reveal(3)).toEqual({ index: 3, word: "she's" });
  });

  it.each([1, 7, -1])("should reveal nothing at index %i, which holds no word", (index) => {
    expect(textGame.reveal(index)).toBeUndefined();
  });

  it("should give the first letter of every word", () => {
    expect(textGame.firstLetters()).toEqual([
      { index: 0, word: "O" },
      { index: 3, word: "s" },
      { index: 5, word: "o" },
    ]);
  });

  it("should give every word", () => {
    expect(textGame.words()).toEqual([
      { index: 0, word: "One" },
      { index: 3, word: "she's" },
      { index: 5, word: "one" },
    ]);
  });
});

describe("an English text with words from other languages", () => {
  /** Returns the words of `text` and what each guess finds. */
  const play = (text: string, guesses: string[]) => {
    const game = new TextGame(text);

    return {
      words: game.words().map(({ word }) => word),
      found: guesses.map((guess) => game.guess(guess).map(({ word }) => word)),
    };
  };

  it("should keep a word with accented letters whole", () => {
    expect(play("A naïve café résumé", ["naïve", "CAFÉ", "résumé"])).toEqual({
      words: ["A", "naïve", "café", "résumé"],
      found: [["naïve"], ["café"], ["résumé"]],
    });
  });

  it("should read a letter typed as a base and a combining mark as the one letter a guess types", () => {
    const game = new TextGame("A cafe\u0301 here");

    expect(game.lexemes()).toEqual(new TextGame("A café here").lexemes());
    expect(game.guess("café")).toEqual([{ index: 2, word: "café" }]);
    expect(game.guess("cafe\u0301")).toEqual([{ index: 2, word: "café" }]);
  });

  it("should keep İ in its word, and find İstanbul's by its base word", () => {
    expect(play("To İstanbul's port", ["İstanbul", "İstanbul's"])).toEqual({
      words: ["To", "İstanbul's", "port"],
      found: [["İstanbul's"], ["İstanbul's"]],
    });
  });

  it("should keep an emoji's variation selector and keycap mark out of words, as before", () => {
    expect(new TextGame("I ❤️ NY").words().map(({ word }) => word)).toEqual(["I", "Ny"]);
    expect(new TextGame("Press 1️⃣ now").words().map(({ word }) => word)).toEqual(["Press", "now"]);
  });

  it("should leave digits out of words, as before", () => {
    expect(new TextGame("In 2026").lexemes()).toEqual([
      { index: 0, length: 2 },
      { index: 1, character: " " },
      { index: 2, character: "2" },
      { index: 3, character: "0" },
      { index: 4, character: "2" },
      { index: 5, character: "6" },
    ]);
  });
});

describe("a text with contractions", () => {
  it.each([
    ["don't", "do not"],
    ["doesn't", "does not"],
    ["didn't", "did not"],
    ["haven't", "have not"],
    ["hadn't", "had not"],
    ["shouldn't", "should not"],
    ["wouldn't", "would not"],
    ["couldn't", "could not"],
    ["mustn't", "must not"],
    ["can't", "cannot"],
    ["needn't", "need not"],
    ["won't", "will not"],
    ["I'm", "I am"],
    ["I've", "I have"],
    ["I'll", "I will"],
    ["she'll", "she will"],
    ["he'll", "he will"],
    ["we're", "we are"],
    ["we've", "we have"],
    ["we'll", "we will"],
    ["they're", "they are"],
    ["they've", "they have"],
    ["they'll", "they will"],
  ])("should spell %s as %s", (contraction, words) => {
    expect(new TextGame(`So ${contraction} go`).words().map(({ word }) => word)).toEqual([
      "So",
      ...words.split(" "),
      "go",
    ]);
  });
});

describe("a text that starts with a contraction", () => {
  it.each([
    ["Needn't", ["Need", "not"]],
    ["Won't", ["Will", "not"]],
    ["We'll", ["We", "will"]],
    ["They're", ["They", "are"]],
  ])("should capitalise only the first word of %s", (contraction, words) => {
    expect(new TextGame(`${contraction} go`).words().map(({ word }) => word)).toEqual([
      ...words,
      "go",
    ]);
  });
});
