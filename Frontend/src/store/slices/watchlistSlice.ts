import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WatchlistState {
  movieIds: string[];
}

const initialState: WatchlistState = {
  movieIds: [],
};

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    setWatchlistIds(state, action: PayloadAction<string[]>) {
      state.movieIds = action.payload;
    },
    addToWatchlistLocal(state, action: PayloadAction<string>) {
      if (!state.movieIds.includes(action.payload)) {
        state.movieIds.push(action.payload);
      }
    },
    removeFromWatchlistLocal(state, action: PayloadAction<string>) {
      state.movieIds = state.movieIds.filter((id) => id !== action.payload);
    },
    clearWatchlist(state) {
      state.movieIds = [];
    },
  },
});

export const { setWatchlistIds, addToWatchlistLocal, removeFromWatchlistLocal, clearWatchlist } =
  watchlistSlice.actions;
export default watchlistSlice.reducer;
