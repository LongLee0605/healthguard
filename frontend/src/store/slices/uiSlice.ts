import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Theme = 'light' | 'dark';

interface UiState {
  theme: Theme;
  sidebarOpen: boolean;
}

const loadTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem('theme') as Theme) || 'light';
};

const initialState: UiState = {
  theme: loadTheme(),
  sidebarOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.theme);
        document.documentElement.classList.toggle('dark', state.theme === 'dark');
      }
    },
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.theme);
        document.documentElement.classList.toggle('dark', state.theme === 'dark');
      }
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
  },
});

export const { toggleTheme, setTheme, setSidebarOpen } = uiSlice.actions;
export default uiSlice.reducer;
