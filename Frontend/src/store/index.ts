import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import filtersReducer from './slices/filtersSlice';
import watchlistReducer from './slices/watchlistSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  filters: filtersReducer,
  watchlist: watchlistReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks — import these everywhere, never raw useSelector/useDispatch
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

// Re-export all actions — one import covers everything
export { setUser, clearUser, setAuthLoading, updateUserField, initializeAuth } from './slices/authSlice';
export { toggleSidebar, setSidebarOpen, setTheme, incrementUnread, setUnreadCount, clearUnread, setGlobalLoading } from './slices/uiSlice';
export { setSearch, setCategory, setGenre, setSortBy, setOrder, setPage, resetFilters } from './slices/filtersSlice';
export { setWatchlistIds, addToWatchlistLocal, removeFromWatchlistLocal, clearWatchlist } from './slices/watchlistSlice';

