import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@shared/types/domain/user';
import { UserRole } from '@shared/constants';

import { POINT_BALANCE_DEFAULT_VALUES } from '../../constants';
import { authService } from '../../services/auth';
import { PointBalancePayload, UserState } from '../../types';
import { ErrorPayload, LoadingPayload } from '../../types/redux';

export const fetchUserData = createAsyncThunk(
  'user/fetchUserData',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.getCurrentUser();
      return user;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      return userData;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const initialState: UserState = {
  id: '',
  email: '',
  role: UserRole.USER,
  currentUser: null,
  user: null,
  username: '',
  avatar: '',
  pointBalance: POINT_BALANCE_DEFAULT_VALUES,
  stats: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

const userStateSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<LoadingPayload>) => {
      state.isLoading = action.payload.isLoading;
    },
    setError: (state, action: PayloadAction<ErrorPayload>) => {
      state.error = action.payload.error;
      state.isLoading = false;
    },
    clearError: state => {
      state.error = null;
    },
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
    },
    setAvatar: (state, action: PayloadAction<string>) => {
      state.avatar = action.payload;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      if (action.payload) {
        state.user = action.payload;
        state.currentUser = action.payload;
        state.username = action.payload.username;
        state.avatar = action.payload.avatar ?? '';
        state.isAuthenticated = true;
      } else {
        state.user = null;
        state.currentUser = null;
        state.username = '';
        state.avatar = '';
        state.isAuthenticated = false;
      }
      state.isLoading = false;
      state.error = null;
    },
    updateScore: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.score = action.payload;
      }
    },
    setPointBalance: (state, action: PayloadAction<PointBalancePayload>) => {
      state.pointBalance = {
        total_points: action.payload.balance,
        free_questions: action.payload.balance - action.payload.purchasedPoints,
        purchased_points: action.payload.purchasedPoints,
        daily_limit: state.pointBalance?.daily_limit ?? 20,
        can_play_free: action.payload.balance - action.payload.purchasedPoints > 0,
        next_reset_time: state.pointBalance?.next_reset_time ?? null,
      };
    },
    deductPoints: (state, action: PayloadAction<number>) => {
      const pointsToDeduct = action.payload;
      let remaining = pointsToDeduct;

      if (!state.pointBalance) {
        return;
      }

      // Deduct from free questions first
      if (state.pointBalance.free_questions > 0 && remaining > 0) {
        const fromFree = Math.min(remaining, state.pointBalance.free_questions);
        state.pointBalance.free_questions -= fromFree;
        remaining -= fromFree;
      }

      // Then deduct from purchased points
      if (remaining > 0) {
        state.pointBalance.purchased_points = Math.max(
          0,
          state.pointBalance.purchased_points - remaining
        );
      }

      // Update total and canPlayFree
      state.pointBalance.total_points =
        state.pointBalance.free_questions + state.pointBalance.purchased_points;
      state.pointBalance.can_play_free = state.pointBalance.free_questions > 0;
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
    logout: state => {
      state.user = null;
      state.username = '';
      state.avatar = '';
      state.isLoading = false;
      state.error = null;
      state.isAuthenticated = false;
    },
    reset: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setUser,
  setUsername,
  setAvatar,
  updateScore,
  setPointBalance,
  deductPoints,
  updateAvatar,
  setAuthenticated,
  logout,
  reset,
} = userStateSlice.actions;

export default userStateSlice.reducer;
