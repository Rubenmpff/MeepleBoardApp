import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import libraryService from "../services/libraryService";
import { UserGameLibrary, PlayedGame } from "../types/UserGameLibrary";
import { GameLibraryStatus } from "../types/GameLibraryStatus";
import { v4 as uuidv4 } from "uuid";

// --- Tipos brutos devolvidos pela API ---
type RawLibraryEntry = {
  id: string;
  gameId: string;
  bggId: number;
  gameName: string;
  gameImageUrl?: string;
  averageRating?: number;
  minPlayers?: number;
  maxPlayers?: number;
  isExpansion?: boolean;
  isCooperative?: boolean;
  supportsSoloMode?: boolean;
  status: number;
  addedAt: string;
  lastPlayedAt?: string;
  totalTimesPlayed?: number;
  totalHoursPlayed?: number;
  pricePaid?: number;
};

// --- Adaptador de dados ---
function adapt(raw: RawLibraryEntry): UserGameLibrary {
  return {
    id: raw.id,
    gameId: String(raw.gameId),
    bggId: Number(raw.bggId),
    gameName: raw.gameName,
    gameImageUrl: raw.gameImageUrl,
    status: raw.status,
    addedAt: raw.addedAt,
    lastPlayedAt: raw.lastPlayedAt,
    totalTimesPlayed: raw.totalTimesPlayed,
    totalHoursPlayed: raw.totalHoursPlayed,
    pricePaid: raw.pricePaid ?? undefined,
    game: {
      id: String(raw.gameId),
      name: raw.gameName,
      imageUrl: raw.gameImageUrl,
      bggId: Number(raw.bggId),
      averageRating: raw.averageRating,
      minPlayers: raw.minPlayers,
      maxPlayers: raw.maxPlayers,
      isExpansion: raw.isExpansion,
      isCooperative: raw.isCooperative,
      supportsSoloMode: raw.supportsSoloMode,
    },
  };
}

// --- Thunks ---
export const fetchUserLibrary = createAsyncThunk<UserGameLibrary[], string>(
  "library/fetchUserLibrary",
  async (userId) => {
    const rawData = await libraryService.getUserLibrary(userId);

    // --- Tratamento robusto do retorno ---
    let list: RawLibraryEntry[] = [];

    if (!rawData) {
      console.warn("⚠️ API returned empty response (null/undefined)");
    } else if (Array.isArray(rawData)) {
      list = rawData;
    } else if (Array.isArray((rawData as any).games)) {
      // Caso backend devolva { games: [...] }
      list = (rawData as any).games;
    } else {
      console.error("⚠️ API returned unexpected format:", rawData);
    }

    return list.map(adapt);
  }
);

export const addGameToLibrary = createAsyncThunk<
  UserGameLibrary,
  { userId: string; gameId: string; bggId?: number; gameName: string; status: GameLibraryStatus; pricePaid?: number }
>(
  "library/addGameToLibrary",
  async ({ userId, gameId, bggId, gameName, status, pricePaid }) => {
    await libraryService.addGameToLibrary(userId, gameId, gameName, status, pricePaid);

    return {
      id: uuidv4(),
      gameId,
      bggId: bggId ?? 0,
      gameName,
      status,
      addedAt: new Date().toISOString(),
      pricePaid,
      game: { id: gameId, name: gameName, imageUrl: undefined, bggId: bggId ?? 0 },
    };
  }
);

export const removeGameFromLibrary = createAsyncThunk<
  string,
  { userId: string; gameId: string }
>("library/removeGameFromLibrary", async ({ userId, gameId }) => {
  await libraryService.removeGameFromLibrary(userId, gameId);
  return gameId;
});

export const updateGameInLibrary = createAsyncThunk<
  { gameId: string; status: GameLibraryStatus; pricePaid?: number | null },
  { userId: string; gameId: string; status: GameLibraryStatus; pricePaid?: number | null }
>("library/updateGameInLibrary", async ({ userId, gameId, status, pricePaid }) => {
  await libraryService.updateGameInLibrary(userId, gameId, status, pricePaid);
  return { gameId, status, pricePaid };
});

export const fetchPlayedGames = createAsyncThunk<PlayedGame[], string>(
  "library/fetchPlayedGames",
  async (userId) => {
    const raw = await libraryService.getPlayedGames(userId);
    return raw.map((r: any) => ({
      gameId: String(r.gameId),
      gameName: r.gameName,
      gameImageUrl: r.gameImageUrl,
      averageRating: r.averageRating,
      minPlayers: r.minPlayers,
      maxPlayers: r.maxPlayers,
      isExpansion: r.isExpansion,
      isCooperative: r.isCooperative,
      supportsSoloMode: r.supportsSoloMode,
      timesPlayed: r.timesPlayed,
      lastPlayedAt: r.lastPlayedAt,
      inLibrary: r.inLibrary,
      status: r.status,
      pricePaid: r.pricePaid,
    }));
  }
);

// --- Estado ---
type LibraryState = {
  items: UserGameLibrary[];
  loading: boolean;
  error: string | null;
  playedGames: PlayedGame[];
  playedGamesLoading: boolean;
};

const initialState: LibraryState = {
  items: [],
  loading: false,
  error: null,
  playedGames: [],
  playedGamesLoading: false,
};

// --- Slice ---
const librarySlice = createSlice({
  name: "library",
  initialState,
  reducers: {
    clearLibrary: (state) => {
      state.items = [];
    },
    addLocalEntry: (state, action: PayloadAction<UserGameLibrary>) => {
      state.items.push(action.payload);
    },
    removeLocalEntry: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((g) => g.gameId !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserLibrary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserLibrary.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchUserLibrary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load library";
      })
      .addCase(addGameToLibrary.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(removeGameFromLibrary.fulfilled, (state, action) => {
        state.items = state.items.filter((g) => g.gameId !== action.payload);
        const played = state.playedGames.find(g => g.gameId === action.payload);
        if (played) { played.inLibrary = false; played.status = undefined; played.pricePaid = undefined; }
      })
      .addCase(updateGameInLibrary.fulfilled, (state, action) => {
        const { gameId, status, pricePaid } = action.payload;
        const entry = state.items.find((g) => g.gameId === gameId);
        if (entry) {
          entry.status = status;
          entry.pricePaid = pricePaid ?? undefined;
        }
        const played = state.playedGames.find(g => g.gameId === gameId);
        if (played) { played.status = status; played.pricePaid = pricePaid ?? undefined; }
      })
      .addCase(fetchPlayedGames.pending, (state) => {
        state.playedGamesLoading = true;
      })
      .addCase(fetchPlayedGames.fulfilled, (state, action) => {
        state.playedGames = action.payload;
        state.playedGamesLoading = false;
      })
      .addCase(fetchPlayedGames.rejected, (state) => {
        state.playedGamesLoading = false;
      });
  },
});

export const { clearLibrary, addLocalEntry, removeLocalEntry } = librarySlice.actions;
export default librarySlice.reducer;
