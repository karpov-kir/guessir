import { describe, expect, it } from "vitest";

import { FakeGame } from "./fakeGame";

describe(FakeGame, () => {
  it("should hold back the answer to the next move until it is released", async () => {
    const game = new FakeGame({
      title: "Title",
      text: "One",
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });
    const release = game.holdNextMove("guess");
    const answers: string[] = [];

    void game.guess("one").then(() => answers.push("held guess"));
    await game.guess("one").then(() => answers.push("next guess"));
    release();
    await expect.poll(() => answers).toEqual(["next guess", "held guess"]);
  });
});
