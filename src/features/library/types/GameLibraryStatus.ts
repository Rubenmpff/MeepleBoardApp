// GameLibraryStatus.ts

export enum GameLibraryStatus {
  Owned = 1,
  Played = 2,
  Wishlist = 3,
}

// 👇 This function returns a user-friendly label for display
export function getStatusLabel(status: GameLibraryStatus): string {
  switch (status) {
    case GameLibraryStatus.Owned:
      return "Owned";
    case GameLibraryStatus.Played:
      return "Played";
    case GameLibraryStatus.Wishlist:
      return "Wishlist";
    default:
      return "Unknown";
  }
}
