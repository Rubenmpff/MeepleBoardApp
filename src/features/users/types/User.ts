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
}