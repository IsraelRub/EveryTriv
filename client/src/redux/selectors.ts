/**
 * Redux Selectors
 * @module ReduxSelectors
 * @description Centralized selectors for Redux state
 */
import type { RootState } from '../types';

// User selectors
export const selectCurrentUser = (state: RootState) => state.user.currentUser;

export const selectUserPointBalance = (state: RootState) => state.user.pointBalance;

export const selectCanPlayFree = (state: RootState) => state.user.pointBalance?.canPlayFree ?? false;

// Game mode selectors
export const selectCurrentGameMode = (state: RootState) => state.gameMode.currentMode;
export const selectCurrentTopic = (state: RootState) => state.gameMode.currentTopic;
export const selectCurrentDifficulty = (state: RootState) => state.gameMode.currentDifficulty;

// Stats selectors
export const selectLeaderboard = (state: RootState) => state.stats.leaderboard;
