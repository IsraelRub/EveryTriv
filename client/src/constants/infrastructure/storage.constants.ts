export const STORAGE_KEYS = {
	// Authentication (localStorage - persistent)
	AUTH_TOKEN: 'access_token',
	REFRESH_TOKEN: 'refresh_token',
	AUTH_USER: 'auth_user',

	// User data (localStorage - persistent)
	USER_ID: 'everytriv_user_id',
	GAME_PREFERENCES: 'everytriv_game_preferences',

	// Game data (localStorage - persistent)
	GAME_STATE: 'game_state',
	GAME_HISTORY: 'game_history',
	USER_PREFERENCES: 'user_preferences',
	CUSTOM_DIFFICULTIES: 'custom_difficulties',
	CUSTOM_DIFFICULTY_HISTORY: 'custom_difficulty_history',

	// UI state (localStorage - persistent)
	AUDIO_VOLUME: 'audio_volume',
	AUDIO_MUTED: 'audio_muted',
	AUDIO_SOUND_ENABLED: 'audio_sound_enabled',
	AUDIO_MUSIC_ENABLED: 'audio_music_enabled',
	SCORE_HISTORY: 'score_history',

	// Temporary data (sessionStorage - session only)
	REDIRECT_AFTER_LOGIN: 'redirectAfterLogin',
	ERROR_LOG: 'error-log',
	ACTIVE_GAME_SESSION: 'active_game_session',
} as const;
