import { revealedWordsSchema, textSkeletonSchema } from "@guessir/game";
import { beforeEach, describe, expect, it } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";

import { newTextSkeleton } from "../../../tests/utils/textSkeleton";
import { GameApi } from "./GameApi";
import { loadRemoteGame } from "./loadRemoteGame";

const skeleton = newTextSkeleton();
let api: MockProxy<GameApi>;

describe(loadRemoteGame, () => {
  beforeEach(() => {
    api = mock<GameApi>();
  });

  it("should load the skeleton and play the game at the same text path", async () => {
    api.get.mockResolvedValue(skeleton);
    api.post.mockResolvedValue({ words: [] });

    const game = await loadRemoteGame(api, "text-id");
    await game.guess("one");

    expect(game.skeleton).toEqual(skeleton);
    expect(api.get).toHaveBeenCalledWith("texts/text-id", textSkeletonSchema);
    expect(api.post).toHaveBeenCalledWith(
      "texts/text-id/guesses",
      { word: "one" },
      revealedWordsSchema,
    );
  });

  it("should keep an id from the page URL to one path segment", async () => {
    api.get.mockResolvedValue(skeleton);

    await loadRemoteGame(api, "../admin?x#y");

    expect(api.get).toHaveBeenCalledWith("texts/..%2Fadmin%3Fx%23y", textSkeletonSchema);
  });
});
