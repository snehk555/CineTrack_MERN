import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AdminState {
  selectedUserId: string | null;
  selectedMovieId: string | null;
  sidebarOpen: boolean;
}

const initialState: AdminState = {
  selectedUserId: null,
  selectedMovieId: null,
  sidebarOpen: true,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setSelectedUser(state, action: PayloadAction<string | null>) {
      state.selectedUserId = action.payload;
    },
    setSelectedMovie(state, action: PayloadAction<string | null>) {
      state.selectedMovieId = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
  },
});

export const { setSelectedUser, setSelectedMovie, toggleSidebar, setSidebarOpen } =
  adminSlice.actions;
export default adminSlice.reducer;
