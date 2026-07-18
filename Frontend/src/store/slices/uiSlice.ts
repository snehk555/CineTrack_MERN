import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Theme = 'dark' | 'light';

interface UiState {
  sidebarOpen: boolean;
  theme: Theme;
  unreadNotifications: number;
  globalLoading: boolean;
}

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem('cinetrack_theme');
  return stored === 'light' ? 'light' : 'dark';
};

const initialState: UiState = {
  sidebarOpen: true,
  theme: getInitialTheme(),
  unreadNotifications: 0,
  globalLoading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
      localStorage.setItem('cinetrack_theme', action.payload);
    },
    incrementUnread(state) {
      state.unreadNotifications += 1;
    },
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadNotifications = action.payload;
    },
    clearUnread(state) {
      state.unreadNotifications = 0;
    },
    setGlobalLoading(state, action: PayloadAction<boolean>) {
      state.globalLoading = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  incrementUnread,
  setUnreadCount,
  clearUnread,
  setGlobalLoading,
} = uiSlice.actions;

export default uiSlice.reducer;
