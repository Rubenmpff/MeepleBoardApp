// src/features/users/types/User.ts

export enum LibraryPrivacy {
  Private = 0,
  FriendsOnly = 1,
  Public = 2,
}

export interface User {
  id: string;
  userName: string;
  email?: string;
  libraryPrivacy?: LibraryPrivacy;
  /** Whether this account's matches may count towards community duration statistics (off by default). */
  contributesDurationStats?: boolean;
}