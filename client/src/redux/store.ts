/**
 * Redux Store Configuration
 *
 * @module ReduxStore
 * @description Main Redux store configuration with all reducers and middleware
 * @used_by client/App, client/hooks, client/services
 */
import { configureStore } from '@reduxjs/toolkit';

import favoritesReducer from './features/favoritesSlice';
import gameModeReducer from './features/gameModeSlice';
import gameReducer from './features/gameSlice';
import statsReducer from './features/statsSlice';
import userReducer from './features/userSlice';

/** Type for Redux dispatch function */
export type AppDispatch = typeof store.dispatch;
/** Type for Redux root state */
export type RootState = ReturnType<typeof store.getState>;

export const store = configureStore({
	reducer: {
		game: gameReducer,
		stats: statsReducer,
		favorites: favoritesReducer,
		user: userReducer,
		gameMode: gameModeReducer,
	},
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: {
				// Ignore these action types
				ignoredActions: ['stats/setStats'],
				// Ignore these field paths in all actions
				ignoredActionPaths: ['payload.created_at', 'payload.updated_at', 'payload.lastPlayed'],
				// Ignore these paths in the state
				ignoredPaths: ['stats.stats.lastPlayed', 'user.user.created_at', 'user.user.updated_at'],
			},
		}),
});
