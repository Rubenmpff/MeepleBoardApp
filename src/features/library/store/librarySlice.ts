import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import libraryService from "../services/libraryService";
import { UserGameLibrary } from "../types/UserGameLibrary";
import { GameLibraryStatus } from "../types/GameLibraryStatus";
import { v4 as uuidv4 } from "uuid";

// --- Tipos brutos devolvidos pela API ---
type RawLibraryEntry = {
  id: string;
  gameId: string;
  bggId: number;
  gameName: string;
  gameImageUrl?: string;
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
    pricePaid: raw.pricePaid,
    game: {
      id: String(raw.gameId),
      name: raw.gameName,
      imageUrl: raw.gameImageUrl,
      bggId: Number(raw.bggId),
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
  { userId: string; gameId: string; gameName: string; status: GameLibraryStatus; pricePaid?: number }
>(
  "library/addGameToLibrary",
  async ({ userId, gameId, gameName, status, pricePaid = 0 }) => {
    await libraryService.addGameToLibrary(userId, gameId, gameName, status, pricePaid);

    return {
      id: uuidv4(),
      gameId,
      bggId: 0,
      gameName,
      status,
      addedAt: new Date().toISOString(),
      pricePaid,
      game: { id: gameId, name: gameName, imageUrl: undefined, bggId: 0 },
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

// --- Estado ---
type LibraryState = {
  items: UserGameLibrary[];
  loading: boolean;
  error: string | null;
};

const initialState: LibraryState = {
  items: [],
  loading: false,
  error: null,
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
      });
  },
});

export const { clearLibrary, addLocalEntry, removeLocalEntry } = librarySlice.actions;
export default librarySlice.reducer;
