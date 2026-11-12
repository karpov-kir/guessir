export interface CreateTextDto {
  title: string;
  description?: string;
  text: string;
  allowShowingFirstLetters: boolean;
  allowShowingText: boolean;
}

/**
 * Maximum lengths of the title, description and text, in code points. The database columns count
 * length in code points, not in UTF-16 units.
 */
export const createTextLimits = { title: 500, description: 4000, text: 4000 } as const;

export interface CreateTextDtoResponse {
  id: string;
}
