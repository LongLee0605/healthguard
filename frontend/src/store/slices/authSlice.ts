import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types';

const TOKEN_KEY = 'hg_token';
const REFRESH_KEY = 'hg_refresh';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  initialized: boolean;
}

const loadToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
};

const loadRefresh = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
};

const initialState: AuthState = {
  user: null,
  token: loadToken(),
  refreshToken: loadRefresh(),
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string; refreshToken: string }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(TOKEN_KEY, action.payload.token);
        localStorage.setItem(REFRESH_KEY, action.payload.refreshToken);
        // Lightweight auth cookie for Next.js middleware (no sensitive data)
        document.cookie = 'hg_auth=1; path=/; SameSite=Strict; max-age=604800';
      }
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(TOKEN_KEY, action.payload);
      }
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        document.cookie = 'hg_auth=; path=/; max-age=0';
      }
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.initialized = action.payload;
    },
  },
});

export const { setCredentials, setToken, setUser, logout, setInitialized } = authSlice.actions;
export default authSlice.reducer;
