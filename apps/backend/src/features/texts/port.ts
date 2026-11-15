/** Means a stored text: the words of one game and the hints its author allows. */
export type Text = {
  id: string;
  title: string;
  description?: string;
  text: string;
  /** Lets the player turn on the hint that shows the first letter of each word. */
  allowShowingFirstLetters: boolean;
  /** Lets the player turn on the hint that shows each hidden word in full. */
  allowShowingText: boolean;
};

/** Holds the stored texts. The feature reads a text by its id and adds new ones. */
export type TextRows = {
  /** Returns the text with `id`, or undefined when there is none. */
  getById(id: string): Promise<Text | undefined>;
  insert(text: Text): Promise<void>;
};
