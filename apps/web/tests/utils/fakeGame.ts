import type { CreateTextDto, RevealedWord } from "@guessir/game";

import { type Game, LocalGame } from "#/entities/game/exports.js";

/** Names a move of the game: a method that asks the game for words. */
type GameMove = "guess" | "reveal" | "firstLetters" | "words";

/**
 * Plays `text` as `LocalGame` does, but lets a test fail a move or hold its answer back, as a
 * server that is down or slow would.
 */
export class FakeGame implements Game {
  public readonly skeleton: LocalGame["skeleton"];
  private readonly localGame: LocalGame;
  private readonly failureCounts = new Map<GameMove, number>();
  private readonly heldAnswers = new Map<GameMove, Promise<void>>();

  constructor(text: CreateTextDto) {
    this.localGame = new LocalGame(text);
    this.skeleton = this.localGame.skeleton;
  }

  /** Makes the next `times` calls of `move` reject, or every later call when `times` is not given. */
  failMove(move: GameMove, times = Number.POSITIVE_INFINITY) {
    this.failureCounts.set(move, times);
  }

  /** Holds back the answer to the next call of `move` until the returned function is called. */
  holdNextMove(move: GameMove): () => void {
    const { promise, resolve } = Promise.withResolvers<void>();

    this.heldAnswers.set(move, promise);

    return () => resolve();
  }

  async guess(word: string): Promise<RevealedWord[]> {
    return this.play("guess", () => this.localGame.guess(word));
  }

  async reveal(index: number): Promise<RevealedWord> {
    return this.play("reveal", () => this.localGame.reveal(index));
  }

  async firstLetters(): Promise<RevealedWord[]> {
    return this.play("firstLetters", () => this.localGame.firstLetters());
  }

  async words(): Promise<RevealedWord[]> {
    return this.play("words", () => this.localGame.words());
  }

  private async play<T>(move: GameMove, answer: () => Promise<T>): Promise<T> {
    const heldAnswer = this.heldAnswers.get(move);

    this.heldAnswers.delete(move);
    await heldAnswer;

    const failureCount = this.failureCounts.get(move) ?? 0;

    if (failureCount > 0) {
      this.failureCounts.set(move, failureCount - 1);
      throw new Error(`The game failed to answer ${move}`);
    }

    return answer();
  }
}
