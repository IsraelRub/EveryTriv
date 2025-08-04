import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './features/gameSlice';
import statsReducer from './features/statsSlice';
import favoritesReducer from './features/favoritesSlice';
import userReducer from './features/userSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    stats: statsReducer,
    favorites: favoritesReducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['stats/setStats'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.createdAt', 'payload.updatedAt', 'payload.lastPlayed'],
        // Ignore these paths in the state
        ignoredPaths: [
          'stats.stats.lastPlayed',
          'user.user.createdAt',
          'user.user.updatedAt',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;