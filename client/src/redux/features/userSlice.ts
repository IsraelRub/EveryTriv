import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../shared/types';

interface UserState {
  user: User | null;
  username: string;
  avatar: string;
  credits: number;
  loading: boolean;
  error: string;
  isAuthenticated: boolean;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
  };
}

const initialState: UserState = {
  user: null,
  username: '',
  avatar: '',
  credits: 0,
  loading: false,
  error: '',
  isAuthenticated: false,
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
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
    },
    setAvatar: (state, action: PayloadAction<string>) => {
      state.avatar = action.payload;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.username = action.payload.username;
      state.avatar = action.payload.avatar || '';
      state.credits = action.payload.credits;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = '';
    },
    updateScore: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.score = action.payload;
      }
    },
    updateCredits: (state, action: PayloadAction<number>) => {
      state.credits = action.payload;
      if (state.user) {
        state.user.credits = action.payload;
      }
    },
    deductCredits: (state, action: PayloadAction<number>) => {
      state.credits = Math.max(0, state.credits - action.payload);
      if (state.user) {
        state.user.credits = state.credits;
      }
    },
    updateAvatar: (state, action: PayloadAction<string>) => {
      state.avatar = action.payload;
      if (state.user) {
        state.user.avatar = action.payload;
      }
    },
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
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
      state.username = '';
      state.avatar = '';
      state.credits = 0;
      state.loading = false;
      state.error = '';
      state.isAuthenticated = false;
    },
  },
});

export const {
  setLoading,
  setError,
  setUser,
  setUsername,
  setAvatar,
  updateScore,
  updateCredits,
  deductCredits,
  updateAvatar,
  setAuthenticated,
  setTheme,
  setLanguage,
  setNotifications,
  logout,
} = userSlice.actions;

export default userSlice.reducer;