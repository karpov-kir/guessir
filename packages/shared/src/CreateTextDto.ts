export interface CreateTextDto {
  title: string;
  description?: string;
  text: string;
  allowShowingFirstLetters: boolean;
  allowShowingText: boolean;
}

/** The longest title, description and text in code points, which is how the database columns count them */
export const createTextLimits = { title: 500, description: 4000, text: 4000 } as const;
