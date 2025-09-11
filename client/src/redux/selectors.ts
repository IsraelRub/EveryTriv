/**
 * Redux Selectors
 * @module ReduxSelectors
 * @description Centralized selectors for Redux state
 */
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../types/redux/state.types';

// Base selectors
export const selectUser = (state: RootState) => state.user;
export const selectGame = (state: RootState) => state.game;
export const selectGameMode = (state: RootState) => state.gameMode;
export const selectStats = (state: RootState) => state.stats;
export const selectFavorites = (state: RootState) => state.favorites;

// User selectors
export const selectCurrentUser = createSelector(
	[selectUser],
	(user) => user.currentUser
);

export const selectIsAuthenticated = createSelector(
	[selectUser],
	(user) => user.isAuthenticated
);

export const selectUserPointBalance = createSelector(
	[selectUser],
	(user) => user.pointBalance
);

export const selectCanPlayFree = createSelector(
	[selectUserPointBalance],
	(balance) => balance?.can_play_free || false
);

// Game selectors
export const selectGameStatus = createSelector(
	[selectGame],
	(game) => game.status
);

export const selectGameData = createSelector(
	[selectGame],
	(game) => game.data
);

export const selectCurrentQuestion = createSelector(
	[selectGameData],
	(data) => data?.questions?.[data.currentQuestionIndex]
);

export const selectGameScore = createSelector(
	[selectGameData],
	(data) => data?.score || 0
);

// Game Mode selectors
export const selectCurrentGameMode = createSelector(
	[selectGameMode],
	(gameMode) => gameMode.currentMode
);

export const selectCurrentTopic = createSelector(
	[selectGameMode],
	(gameMode) => gameMode.currentTopic
);

export const selectCurrentDifficulty = createSelector(
	[selectGameMode],
	(gameMode) => gameMode.currentDifficulty
);

// Stats selectors
export const selectUserStats = createSelector(
	[selectStats],
	(stats) => stats.stats
);

export const selectLeaderboard = createSelector(
	[selectStats],
	(stats) => stats.leaderboard
);

// Favorites selectors
export const selectFavoriteTopics = createSelector(
	[selectFavorites],
	(favorites) => favorites.favoriteTopics
);

export const selectFavoriteTopicsList = createSelector(
	[selectFavorites],
	(favorites) => favorites.topics
);

// Loading selectors
export const selectIsUserLoading = createSelector(
	[selectUser],
	(user) => user.isLoading
);

export const selectIsGameLoading = createSelector(
	[selectGame],
	(game) => game.isLoading
);

export const selectIsStatsLoading = createSelector(
	[selectStats],
	(stats) => stats.isLoading
);

export const selectIsFavoritesLoading = createSelector(
	[selectFavorites],
	(favorites) => favorites.isLoading
);

// Error selectors
export const selectUserError = createSelector(
	[selectUser],
	(user) => user.error
);

export const selectGameError = createSelector(
	[selectGame],
	(game) => game.error
);

export const selectStatsError = createSelector(
	[selectStats],
	(stats) => stats.error
);

export const selectFavoritesError = createSelector(
	[selectFavorites],
	(favorites) => favorites.error
);

// Combined selectors
export const selectAnyLoading = createSelector(
	[selectIsUserLoading, selectIsGameLoading, selectIsStatsLoading, selectIsFavoritesLoading],
	(userLoading, gameLoading, statsLoading, favoritesLoading) => 
		userLoading || gameLoading || statsLoading || favoritesLoading
);

export const selectAnyError = createSelector(
	[selectUserError, selectGameError, selectStatsError, selectFavoritesError],
	(userError, gameError, statsError, favoritesError) => 
		userError || gameError || statsError || favoritesError
);
