import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import type { BasicUser } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { CREDIT_BALANCE_DEFAULT_VALUES } from '../../constants';
import { authService } from '../../services';
import { CreditBalancePayload, ErrorPayload, LoadingPayload, UserState } from '../../types';

export const fetchUserData = createAsyncThunk('user/fetchUserData', async (_, { rejectWithValue }) => {
	try {
		const user = await authService.getCurrentUser();
		return user;
	} catch (error) {
		return rejectWithValue(getErrorMessage(error));
	}
});

export const updateUserProfile = createAsyncThunk(
	'user/updateUserProfile',
	async (userData: Partial<BasicUser>, { rejectWithValue }) => {
		try {
			return userData;
		} catch (error) {
			return rejectWithValue(getErrorMessage(error));
		}
	}
);

const initialState: UserState = {
	currentUser: null,
	avatar: '',
	creditBalance: CREDIT_BALANCE_DEFAULT_VALUES,
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
		setAvatar: (state, action: PayloadAction<string>) => {
			state.avatar = action.payload;
		},
		setUser: (state, action: PayloadAction<BasicUser | null>) => {
			if (action.payload) {
				state.currentUser = action.payload;
				state.avatar = '';
				state.isAuthenticated = true;
			} else {
				state.currentUser = null;
				state.avatar = '';
				state.isAuthenticated = false;
			}
			state.isLoading = false;
			state.error = null;
		},
		setCreditBalance: (state, action: PayloadAction<CreditBalancePayload>) => {
			const freeQuestions = action.payload.freeQuestions;
			const purchasedCredits = action.payload.purchasedCredits;
			const dailyLimit = action.payload.dailyLimit ?? state.creditBalance?.dailyLimit ?? 20;
			const nextResetTime = action.payload.nextResetTime ?? state.creditBalance?.nextResetTime ?? null;

			// Calculate credits: balance (totalCredits) - purchasedCredits - freeQuestions
			// If balance is provided as totalCredits, extract credits
			const credits = action.payload.balance - purchasedCredits - freeQuestions;
			const totalCredits = credits + purchasedCredits + freeQuestions;

			state.creditBalance = {
				totalCredits,
				credits: Math.max(0, credits), // Ensure non-negative
				freeQuestions,
				purchasedCredits,
				dailyLimit,
				canPlayFree: freeQuestions > 0,
				nextResetTime,
			};
		},
		deductCredits: (state, action: PayloadAction<number>) => {
			const creditsToDeduct = action.payload;
			let remaining = creditsToDeduct;

			if (!state.creditBalance) {
				return;
			}

			// Initialize credits if not present (backward compatibility)
			if (state.creditBalance.credits === undefined) {
				state.creditBalance.credits = Math.max(
					0,
					(state.creditBalance.totalCredits ?? 0) -
						(state.creditBalance.purchasedCredits ?? 0) -
						(state.creditBalance.freeQuestions ?? 0)
				);
			}

			// Deduct from free questions first
			if (state.creditBalance.freeQuestions > 0 && remaining > 0) {
				const fromFree = Math.min(remaining, state.creditBalance.freeQuestions);
				state.creditBalance.freeQuestions -= fromFree;
				remaining -= fromFree;
			}

			// Then deduct from purchased credits
			if (remaining > 0 && state.creditBalance.purchasedCredits > 0) {
				const fromPurchased = Math.min(remaining, state.creditBalance.purchasedCredits);
				state.creditBalance.purchasedCredits -= fromPurchased;
				remaining -= fromPurchased;
			}

			// Finally deduct from credits
			if (remaining > 0) {
				state.creditBalance.credits = Math.max(0, state.creditBalance.credits - remaining);
			}

			// Update total and canPlayFree
			state.creditBalance.totalCredits =
				state.creditBalance.credits + state.creditBalance.purchasedCredits + state.creditBalance.freeQuestions;
			state.creditBalance.canPlayFree = state.creditBalance.freeQuestions > 0;
		},
		updateAvatar: (state, action: PayloadAction<string>) => {
			state.avatar = action.payload;
		},
		setAuthenticated: (state, action: PayloadAction<boolean>) => {
			state.isAuthenticated = action.payload;
		},
		logout: state => {
			state.currentUser = null;
			state.avatar = '';
			state.isLoading = false;
			state.error = null;
			state.isAuthenticated = false;
		},
		reset: () => initialState,
	},
});

export const { setUser, setAvatar, setCreditBalance, deductCredits, setAuthenticated } = userStateSlice.actions;

export default userStateSlice.reducer;
