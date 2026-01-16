import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import storageSession from 'redux-persist/lib/storage/session';

import audioSettingsReducer from './slices/audioSettingsSlice';
import gameModeReducer from './slices/gameModeSlice';
import gameSessionReducer from './slices/gameSessionSlice';
import multiplayerReducer from './slices/multiplayerSlice';
import uiPreferencesReducer from './slices/uiPreferencesSlice';

const gameModePersistConfig = {
	key: 'gameMode',
	storage,
	whitelist: ['currentSettings'],
};

const audioSettingsPersistConfig = {
	key: 'audioSettings',
	storage,
	whitelist: ['volume', 'isMuted', 'soundEnabled', 'musicEnabled'],
};

const uiPreferencesPersistConfig = {
	key: 'uiPreferences',
	storage: storageSession,
	whitelist: ['leaderboardPeriod'],
};

const gameSessionPersistConfig = {
	key: 'gameSession',
	storage: storageSession,
	whitelist: [
		'gameId',
		'currentQuestionIndex',
		'gameQuestionCount',
		'score',
		'correctAnswers',
		'questions',
		'questionsData',
		'streak',
		'gameStartTime',
		'timeSpent',
	],
};

const persistedGameModeReducer = persistReducer(gameModePersistConfig, gameModeReducer);
const persistedAudioSettingsReducer = persistReducer(audioSettingsPersistConfig, audioSettingsReducer);
const persistedUIPreferencesReducer = persistReducer(uiPreferencesPersistConfig, uiPreferencesReducer);
const persistedGameSessionReducer = persistReducer(gameSessionPersistConfig, gameSessionReducer);

export const store = configureStore({
	reducer: {
		gameMode: persistedGameModeReducer,
		gameSession: persistedGameSessionReducer,
		multiplayer: multiplayerReducer,
		audioSettings: persistedAudioSettingsReducer,
		uiPreferences: persistedUIPreferencesReducer,
	},
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
				ignoredActionPaths: [
					'payload.created_at',
					'payload.updated_at',
					'payload.lastPlayed',
					'payload.joinedAt',
					'payload.lastActivity',
					'payload.createdAt',
					'payload.updatedAt',
					'payload.startTime',
					'payload.endTime',
					'payload.currentQuestionStartTime',
					'payload.startedAt',
				],
			},
		}),
});

export type AppDispatch = typeof store.dispatch;

export const persistor = persistStore(store);
