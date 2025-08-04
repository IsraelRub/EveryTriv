import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../shared/types';

interface UserState {
  user: User | null;
  loading: boolean;
  error: string;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
  };
}

const initialState: UserState = {
  user: null,
  loading: false,
  error: '',
  preferences: {
    theme: 'light',
    language: 'en',
    notifications: true,
  },
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.loading = false;
      state.error = '';
    },
    updateScore: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.score = action.payload;
      }
    },
    updateAvatar: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.avatar = action.payload;
      }
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.preferences.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.preferences.language = action.payload;
    },
    setNotifications: (state, action: PayloadAction<boolean>) => {
      state.preferences.notifications = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.loading = false;
      state.error = '';
    },
  },
});

export const {
  setLoading,
  setError,
  setUser,
  updateScore,
  updateAvatar,
  setTheme,
  setLanguage,
  setNotifications,
  logout,
} = userSlice.actions;

export default userSlice.reducer;