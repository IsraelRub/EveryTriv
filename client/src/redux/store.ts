/**
 * Redux Store Configuration
 *
 * @module ReduxStore
 * @description Main Redux store configuration with all reducers and middleware
 * @used_by client/src/App.tsx, client/src/hooks, client/src/services
 */
import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import sessionStorage from 'redux-persist/lib/storage/session';

import favoritesReducer from './slices/favoritesSlice';
import gameModeReducer from './slices/gameModeSlice';
import gameReducer from './slices/gameSlice';
import userReducer from './slices/userSlice';

const userPersistConfig = {
	key: 'user',
	storage: sessionStorage, // sessionStorage - independent per tab
	whitelist: ['user'],
};

const favoritesPersistConfig = {
	key: 'favorites',
	storage,
	whitelist: ['favorites'],
};

const gameModePersistConfig = {
	key: 'gameMode',
	storage,
	whitelist: ['currentSettings'],
};

const persistedFavoritesReducer = persistReducer(favoritesPersistConfig, favoritesReducer);
const persistedUserReducer = persistReducer(userPersistConfig, userReducer);
const persistedGameModeReducer = persistReducer(gameModePersistConfig, gameModeReducer);

export const store = configureStore({
	reducer: {
		game: gameReducer,
		favorites: persistedFavoritesReducer,
		user: persistedUserReducer,
		gameMode: persistedGameModeReducer,
	},
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
				ignoredActionPaths: ['payload.created_at', 'payload.updated_at', 'payload.lastPlayed'],
				ignoredPaths: ['user.user.created_at', 'user.user.updated_at'],
			},
		}),
});

/** Type for Redux dispatch function */
export type AppDispatch = typeof store.dispatch;

export const persistor = persistStore(store);
