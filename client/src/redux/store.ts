/**
 * Redux Store Configuration
 *
 * @module ReduxStore
 * @description Main Redux store configuration with all reducers and middleware
 * @used_by client/App.tsx, client/hooks, client/services
 */
import { configureStore } from '@reduxjs/toolkit';
import { persistReducer,persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import favoritesReducer from './slices/favoritesSlice';
import gameModeReducer from './slices/gameModeSlice';
import gameReducer from './slices/gameSlice';
import statsReducer from './slices/statsSlice';
import userReducer from './slices/userSlice';

// Persist configuration - not used but kept for reference
// const persistConfig = {
// 	key: 'root',
// 	storage,
// 	whitelist: ['user', 'favorites', 'gameMode'], // Only persist these reducers
// 	blacklist: ['game', 'stats'], // Don't persist temporary state
// };

// Persist configuration for user slice
const userPersistConfig = {
  key: 'user',
  storage,
  whitelist: ['user'], // Only persist user data, not loading states
};

// Persist configuration for favorites slice
const favoritesPersistConfig = {
  key: 'favorites',
  storage,
  whitelist: ['favorites'], // Only persist favorites data
};

// Persist configuration for gameMode slice
const gameModePersistConfig = {
  key: 'gameMode',
  storage,
  whitelist: ['currentSettings'], // Only persist game mode settings
};

export const store = configureStore({
  reducer: {
    game: gameReducer,
    stats: statsReducer,
    favorites: persistReducer(favoritesPersistConfig, favoritesReducer) as never,
    user: persistReducer(userPersistConfig, userReducer) as never,
    gameMode: persistReducer(gameModePersistConfig, gameModeReducer) as never,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['stats/setStats', 'persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.created_at', 'payload.updated_at', 'payload.lastPlayed'],
        // Ignore these paths in the state
        ignoredPaths: ['stats.stats.lastPlayed', 'user.user.created_at', 'user.user.updated_at'],
      },
    }),
});

/** Type for Redux dispatch function */
export type AppDispatch = typeof store.dispatch;

export const persistor = persistStore(store);
