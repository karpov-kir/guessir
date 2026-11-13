import { createTextDtoResponseSchema } from "@guessir/game";
import { describe, expect, it } from "vitest";
import { mock } from "vitest-mock-extended";

import { CreateTextApi, createText } from "./createTextApi";

describe(createText, () => {
  it("should post the text and return its id", async () => {
    const api = mock<CreateTextApi>();
    const payload = {
      title: "Title",
      text: "One",
      allowShowingFirstLetters: true,
      allowShowingText: true,
    };

    api.post.mockResolvedValue({ id: "text-id" });

    await expect(createText(api, payload)).resolves.toEqual({ id: "text-id" });
    expect(api.post).toHaveBeenCalledWith("texts", payload, createTextDtoResponseSchema);
  });
});
