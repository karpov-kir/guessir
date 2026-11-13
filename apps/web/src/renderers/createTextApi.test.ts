import { createTextDtoResponseSchema } from "@guessir/game";
import { describe, expect, it } from "vitest";
import { mock } from "vitest-mock-extended";

import { HttpClient } from "../utils/HttpClient";
import { createText } from "./createTextApi";

describe(createText, () => {
  it("should post the text and return its id", async () => {
    const httpClient = mock<HttpClient>();
    const payload = {
      title: "Title",
      text: "One",
      allowShowingFirstLetters: true,
      allowShowingText: true,
    };

    httpClient.post.mockResolvedValue({ id: "text-id" });

    await expect(createText(httpClient, payload)).resolves.toEqual({ id: "text-id" });
    expect(httpClient.post).toHaveBeenCalledWith("texts", payload, createTextDtoResponseSchema);
  });
});
