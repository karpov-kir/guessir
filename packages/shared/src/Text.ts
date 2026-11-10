export interface Text {
  id: string;
  title: string;
  description?: string;
  text: string;
  /** Lets the reader turn on the hint that shows the first letter of each word. */
  allowShowingFirstLetters: boolean;
  /** Lets the reader turn on the hint that shows each hidden word in full. */
  allowShowingText: boolean;
  createdAt: Date;
  updatedAt: Date;
}
