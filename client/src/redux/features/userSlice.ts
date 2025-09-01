import { createSlice,PayloadAction } from '@reduxjs/toolkit';
import { User } from 'everytriv-shared/types/user.types';

import { PointBalancePayload, UserState } from '../../types';

const initialState: UserState = {
	user: null,
	username: '',
	avatar: '',
	pointBalance: {
		total_points: 0,
		free_questions: 0,
		purchased_points: 0,
		daily_limit: 20,
		can_play_free: false,
		next_reset_time: null,
	},
	loading: false,
	error: null,
	isAuthenticated: false,
};

const userStateSlice = createSlice({
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
			state.isAuthenticated = true;
			state.loading = false;
			state.error = null;
		},
		updateScore: (state, action: PayloadAction<number>) => {
			if (state.user) {
				state.user.score = action.payload;
			}
		},
		setPointBalance: (state, action: PayloadAction<PointBalancePayload>) => {
			state.pointBalance = {
				...action.payload.balance,
				next_reset_time: action.payload.balance.next_reset_time
					? new Date(action.payload.balance.next_reset_time).toISOString()
					: null,
			};
		},
		deductPoints: (state, action: PayloadAction<number>) => {
			const pointsToDeduct = action.payload;
			let remaining = pointsToDeduct;

			// Deduct from free questions first
			if (state.pointBalance.free_questions > 0 && remaining > 0) {
				const fromFree = Math.min(remaining, state.pointBalance.free_questions);
				state.pointBalance.free_questions -= fromFree;
				remaining -= fromFree;
			}

			// Then deduct from purchased points
			if (remaining > 0) {
				state.pointBalance.purchased_points = Math.max(0, state.pointBalance.purchased_points - remaining);
			}

			// Update total and canPlayFree
			state.pointBalance.total_points = state.pointBalance.free_questions + state.pointBalance.purchased_points;
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
			state.loading = false;
			state.error = null;
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
	setPointBalance,
	deductPoints,
	updateAvatar,
	setAuthenticated,
	logout,
} = userStateSlice.actions;

export default userStateSlice.reducer;
