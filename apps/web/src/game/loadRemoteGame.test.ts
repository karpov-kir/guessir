import { beforeEach, describe, expect, it } from "vitest";
import { mock, MockProxy } from "vitest-mock-extended";

import { newTextSkeleton } from "../../tests/utils/textSkeleton";
import { HttpClient } from "../utils/HttpClient";
import { loadRemoteGame } from "./loadRemoteGame";

const skeleton = newTextSkeleton();
let httpClient: MockProxy<HttpClient>;

describe(loadRemoteGame, () => {
  beforeEach(() => {
    httpClient = mock<HttpClient>();
  });

  it("should load the skeleton and play the game at the same text path", async () => {
    httpClient.get.mockResolvedValue(skeleton);
    httpClient.post.mockResolvedValue({ words: [] });

    const game = await loadRemoteGame(httpClient, "text-id");
    await game.guess("one");

    expect(game.skeleton).toEqual(skeleton);
    expect(httpClient.get).toBeCalledWith("texts/text-id");
    expect(httpClient.post).toBeCalledWith("texts/text-id/guesses", { word: "one" });
  });

  it("should keep an id from the page URL to one path segment", async () => {
    httpClient.get.mockResolvedValue(skeleton);

    await loadRemoteGame(httpClient, "../admin?x#y");

    expect(httpClient.get).toBeCalledWith("texts/..%2Fadmin%3Fx%23y");
  });
});
