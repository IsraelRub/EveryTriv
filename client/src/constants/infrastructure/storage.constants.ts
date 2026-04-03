export const STORAGE_KEYS = {
	// Authentication (sessionStorage - per-tab; allows separate players per tab)
	AUTH_TOKEN: 'access_token',
	REFRESH_TOKEN: 'refresh_token',
	AUTH_USER: 'auth_user',

	// User data (localStorage - persistent)
	USER_ID: 'everytriv_user_id',
	PERSISTENT_REFRESH_TOKEN: 'everytriv_persistent_refresh_token',
	GAME_PREFERENCES: 'everytriv_game_preferences',

	// Game data (localStorage - persistent)
	GAME_STATE: 'game_state',
	GAME_HISTORY: 'game_history',
	USER_PREFERENCES: 'user_preferences',
	CUSTOM_DIFFICULTIES: 'custom_difficulties',
	CUSTOM_DIFFICULTY_HISTORY: 'custom_difficulty_history',

	// UI state (localStorage - persistent)
	GAME_MODE: 'persist:gameMode',
	AUDIO_SETTINGS: 'persist:audioSettings',
	UI_PREFERENCES: 'persist:uiPreferences',
	AUDIO_VOLUME: 'audio_volume',
	AUDIO_MUTED: 'audio_muted',
	AUDIO_SOUND_ENABLED: 'audio_sound_enabled',
	AUDIO_MUSIC_ENABLED: 'audio_music_enabled',
	SCORE_HISTORY: 'score_history',

	// Temporary data (sessionStorage - session only)

	OAUTH_INITIATED_FROM_REGISTRATION: 'everytriv_oauth_from_registration',

	PENDING_OPTIONAL_AVATAR_AFTER_PROFILE: 'everytriv_pending_optional_avatar_after_profile',
	REDIRECT_AFTER_LOGIN: 'redirectAfterLogin',
	ERROR_LOG: 'error-log',
	ACTIVE_GAME_SESSION: 'active_game_session',

	MULTIPLAYER_SUMMARY_PREFIX: 'multiplayer_summary_',
} as const;

export const AUTH_TOKEN_CHANGED_EVENT = 'auth-token-changed';

export type StorageKey = StaticStorageKey | MultiplayerSummaryStorageKey | ErrorLogStorageKey;

export function getMultiplayerSummaryStorageKey(roomId: string): MultiplayerSummaryStorageKey {
	const key = `${STORAGE_KEYS.MULTIPLAYER_SUMMARY_PREFIX}${roomId}`;
	if (!isMultiplayerSummaryStorageKey(key)) throw new Error('Invalid multiplayer summary key');
	return key;
}

export function getErrorLogStorageKey(featureName: string): ErrorLogStorageKey {
	const key = `${STORAGE_KEYS.ERROR_LOG}-${featureName}`;
	if (!isErrorLogStorageKey(key)) throw new Error('Invalid error log key');
	return key;
}

export const AUTH_STORAGE_KEYS = new Set<StorageKey>([
	STORAGE_KEYS.AUTH_TOKEN,
	STORAGE_KEYS.REFRESH_TOKEN,
	STORAGE_KEYS.AUTH_USER,
]);
function isMultiplayerSummaryStorageKey(key: string): key is MultiplayerSummaryStorageKey {
	return key.startsWith(STORAGE_KEYS.MULTIPLAYER_SUMMARY_PREFIX);
}

function isErrorLogStorageKey(key: string): key is ErrorLogStorageKey {
	return key.startsWith(`${STORAGE_KEYS.ERROR_LOG}-`);
}

export type StaticStorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export type MultiplayerSummaryStorageKey = `${typeof STORAGE_KEYS.MULTIPLAYER_SUMMARY_PREFIX}${string}`;
export type ErrorLogStorageKey = `error-log-${string}`;

export type SessionStorageKey =
	| typeof STORAGE_KEYS.AUTH_TOKEN
	| typeof STORAGE_KEYS.REFRESH_TOKEN
	| typeof STORAGE_KEYS.AUTH_USER;
