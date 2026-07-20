import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AdminUser } from '@/types';
import apiClient from '@/services/axios';

// ─── Async Thunk: Check session on app load ────────────────────────────────
export const initializeAdminAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<{ success: boolean; data: { user: AdminUser } }>(
        '/v1/admin/auth/me'
      );
      return data.data.user;
    } catch {
      return rejectWithValue(null);
    }
  }
);

// ─── State ─────────────────────────────────────────────────────────────────
interface AuthState {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isTwoFARequired: boolean;
}

const initialState: AuthState = {
  admin: null,
  isAuthenticated: false,
  isLoading: true,
  isTwoFARequired: false,
};

// ─── Slice ─────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAdmin(state, action: PayloadAction<AdminUser>) {
      state.admin = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.isTwoFARequired = false;
    },
    clearAdmin(state) {
      state.admin = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.isTwoFARequired = false;
    },
    setTwoFARequired(state, action: PayloadAction<boolean>) {
      state.isTwoFARequired = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAdminAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAdminAuth.fulfilled, (state, action) => {
        state.admin = action.payload;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(initializeAdminAuth.rejected, (state) => {
        state.admin = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      });
  },
});

export const { setAdmin, clearAdmin, setTwoFARequired } = authSlice.actions;
export default authSlice.reducer;
