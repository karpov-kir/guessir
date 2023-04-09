export interface Text {
  id: string;
  title: string;
  description?: string;
  text: string;
  allowShowingFirstLetters: boolean;
  allowShowingText: boolean;
  createdAt: Date;
  updatedAt: Date;
}
