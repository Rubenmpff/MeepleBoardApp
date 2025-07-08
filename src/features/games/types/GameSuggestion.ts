/**
 * Represents a lightweight suggestion from BGG or local DB.
 */
export interface GameSuggestion {
  /** BoardGameGeek ID (guaranteed to exist) */
  bggId: number;

  /** Name or title of the game */
  name: string;

  /** Optional year of publication */
  yearPublished?: number;

  /** Optional image or thumbnail URL */
  imageUrl?: string;
}
