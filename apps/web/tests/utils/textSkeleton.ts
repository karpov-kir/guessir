import { TextSkeleton } from "@guessir/game";

export function newTextSkeleton(): TextSkeleton {
  return {
    title: "Title",
    allowShowingFirstLetters: true,
    allowShowingText: true,
    wordCount: 1,
    lexemes: [{ index: 0, length: 3 }],
  };
}
