import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { BasicUser } from '@shared/types';

import { POINT_BALANCE_DEFAULT_VALUES } from '../../constants';
import { authService } from '../../services';
import { ErrorPayload, LoadingPayload, PointBalancePayload, UserState } from '../../types';

export const fetchUserData = createAsyncThunk('user/fetchUserData', async (_, { rejectWithValue }) => {
	try {
		const user = await authService.getCurrentUser();
		return user;
	} catch (error) {
		return rejectWithValue((error as Error).message);
	}
});

export const updateUserProfile = createAsyncThunk(
	'user/updateUserProfile',
	async (userData: Partial<BasicUser>, { rejectWithValue }) => {
		try {
			return userData;
		} catch (error) {
			return rejectWithValue((error as Error).message);
		}
	}
);

const initialState: UserState = {
	currentUser: null,
	username: '',
	avatar: '',
	pointBalance: POINT_BALANCE_DEFAULT_VALUES,
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
		setUser: (state, action: PayloadAction<BasicUser | null>) => {
			if (action.payload) {
				state.currentUser = action.payload;
				state.username = action.payload.username;
				state.avatar = '';
				state.isAuthenticated = true;
			} else {
				state.currentUser = null;
				state.username = '';
				state.avatar = '';
				state.isAuthenticated = false;
			}
			state.isLoading = false;
			state.error = null;
		},
		setPointBalance: (state, action: PayloadAction<PointBalancePayload>) => {
			state.pointBalance = {
				totalPoints: action.payload.balance,
				freeQuestions: action.payload.balance - action.payload.purchasedPoints,
				purchasedPoints: action.payload.purchasedPoints,
				dailyLimit: state.pointBalance?.dailyLimit ?? 20,
				canPlayFree: action.payload.balance - action.payload.purchasedPoints > 0,
				nextResetTime: state.pointBalance?.nextResetTime ?? null,
			};
		},
		deductPoints: (state, action: PayloadAction<number>) => {
			const pointsToDeduct = action.payload;
			let remaining = pointsToDeduct;

			if (!state.pointBalance) {
				return;
			}

			// Deduct from free questions first
			if (state.pointBalance.freeQuestions > 0 && remaining > 0) {
				const fromFree = Math.min(remaining, state.pointBalance.freeQuestions);
				state.pointBalance.freeQuestions -= fromFree;
				remaining -= fromFree;
			}

			// Then deduct from purchased points
			if (remaining > 0) {
				state.pointBalance.purchasedPoints = Math.max(0, state.pointBalance.purchasedPoints - remaining);
			}

			// Update total and canPlayFree
			state.pointBalance.totalPoints = state.pointBalance.freeQuestions + state.pointBalance.purchasedPoints;
			state.pointBalance.canPlayFree = state.pointBalance.freeQuestions > 0;
		},
		updateAvatar: (state, action: PayloadAction<string>) => {
			state.avatar = action.payload;
		},
		setAuthenticated: (state, action: PayloadAction<boolean>) => {
			state.isAuthenticated = action.payload;
		},
		logout: state => {
			state.currentUser = null;
			state.username = '';
			state.avatar = '';
			state.isLoading = false;
			state.error = null;
			state.isAuthenticated = false;
		},
		reset: () => initialState,
	},
});

export const { setUser, setUsername, setAvatar, setPointBalance, deductPoints, setAuthenticated } =
	userStateSlice.actions;

export default userStateSlice.reducer;
