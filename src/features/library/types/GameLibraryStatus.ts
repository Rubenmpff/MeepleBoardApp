export enum GameLibraryStatus {
  Owned = 1,
  Played = 2,
  Wishlist = 3,
}

export type GameLibraryStatusTranslationKey =
  | "status.owned"
  | "status.played"
  | "status.wishlist"
  | "status.unknown";

export function getStatusTranslationKey(
  status: GameLibraryStatus
): GameLibraryStatusTranslationKey {
  switch (status) {
    case GameLibraryStatus.Owned:
      return "status.owned";
    case GameLibraryStatus.Played:
      return "status.played";
    case GameLibraryStatus.Wishlist:
      return "status.wishlist";
    default:
      return "status.unknown";
  }
}
