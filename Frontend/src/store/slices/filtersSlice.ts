import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FiltersState {
  search: string;
  category: string;
  genre: string;
  sortBy: 'createdAt' | 'rating' | 'title' | 'releaseYear';
  order: 'asc' | 'desc';
  page: number;
  limit: number;
}

const initialState: FiltersState = {
  search: '',
  category: '',
  genre: '',
  sortBy: 'createdAt',
  order: 'desc',
  page: 1,
  limit: 12,
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 1;
    },
    setCategory(state, action: PayloadAction<string>) {
      state.category = action.payload;
      state.page = 1;
    },
    setGenre(state, action: PayloadAction<string>) {
      state.genre = action.payload;
      state.page = 1;
    },
    setSortBy(state, action: PayloadAction<FiltersState['sortBy']>) {
      state.sortBy = action.payload;
      state.page = 1;
    },
    setOrder(state, action: PayloadAction<'asc' | 'desc'>) {
      state.order = action.payload;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    resetFilters() {
      return initialState;
    },
  },
});

export const { setSearch, setCategory, setGenre, setSortBy, setOrder, setPage, resetFilters } =
  filtersSlice.actions;
export default filtersSlice.reducer;
