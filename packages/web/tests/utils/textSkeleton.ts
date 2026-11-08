import { TextSkeleton } from '@guessir/shared/dist/game/types';

export function newTextSkeleton(): TextSkeleton {
  return {
    title: 'Title',
    allowShowingFirstLetters: true,
    allowShowingText: true,
    wordCount: 1,
    lexemes: [{ index: 0, length: 3 }],
  };
}
