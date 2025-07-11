/**
 * Represents a lightweight suggestion from BGG or local DB.
 */
export interface GameSuggestion {
  /** Internal ID (only if from local DB) */
  id?: string;

  /** BoardGameGeek ID (always present) */
  bggId: number;

  /** Name or title */
  name: string;

  /** Optional year */
  yearPublished?: number;

  /** Optional image */
  imageUrl?: string;
}
