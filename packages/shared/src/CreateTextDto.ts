export interface CreateTextDto {
  title: string;
  description?: string;
  text: string;
  allowShowingFirstLetters: boolean;
  allowShowingText: boolean;
}
