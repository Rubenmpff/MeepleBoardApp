export interface PlayerState {
  id: string;            // Unique ID of the player (usually matches user ID)
  username: string;      // Display name of the player
  isWinner: boolean;     // Whether this player won the match
  score?: string;        // Optional score input (as string for input handling)
}
