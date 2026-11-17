/**
 * Lists the events the game tracks. The channel's allowlist on the intake holds these names and
 * their params, so a renamed event, param or value needs a matching change there.
 */
export enum AnalyticsEvents {
  /** A guess was checked, with `is_hit`: the guess opened at least one word. */
  GuessMade = "guess_made",
  /** A hint was turned on, with `hint`: a `ShownHint`. */
  HintShown = "hint_shown",
  /** A word was opened without guessing it. */
  WordRevealed = "word_revealed",
  /** A player made a game from their own text. */
  TextCreated = "text_created",
  /** The link to a new game was copied. */
  GameLinkCopied = "game_link_copied",
}

/** Names the hint of a `hint_shown` event. */
export enum ShownHint {
  FirstLetters = "first_letters",
  Text = "text",
}
