/**
 * Redux Selectors
 * @module ReduxSelectors
 * @description Centralized selectors for Redux state
 */
import type { RootState } from '../types';

// User selectors
export const selectUserCreditBalance = (state: RootState) => state.user.creditBalance;

export const selectCanPlayFree = (state: RootState) => state.user.creditBalance?.canPlayFree ?? false;

export const selectCurrentUser = (state: RootState) => state.user.currentUser;

export const selectUserRole = (state: RootState) => state.user.currentUser?.role;

// Game mode selectors
export const selectCurrentGameMode = (state: RootState) => state.gameMode.currentMode;
export const selectCurrentTopic = (state: RootState) => state.gameMode.currentTopic;
export const selectCurrentDifficulty = (state: RootState) => state.gameMode.currentDifficulty;

// Stats selectors
export const selectLeaderboard = (state: RootState) => state.stats.leaderboard;
