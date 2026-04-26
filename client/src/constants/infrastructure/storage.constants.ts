export enum StorageKeys {
	// Session — authentication (per tab; separate players per browser tab)
	AUTH_TOKEN = 'access_token',
	AUTH_USER = 'auth_user',
	REFRESH_TOKEN = 'refresh_token',

	// Session — registration & post–sign-in onboarding (flags consumed after use)
	OAUTH_INITIATED_FROM_REGISTRATION = 'everytriv_oauth_from_registration',
	REGISTRATION_EMAIL_PENDING_OPTIONAL_AVATAR = 'everytriv_email_reg_pending_optional_avatar',
	PENDING_OPTIONAL_AVATAR_AFTER_PROFILE = 'everytriv_pending_optional_avatar_after_profile',
	SHOW_OPTIONAL_AVATAR_ON_HOME = 'everytriv_show_optional_avatar_on_home',
	REDIRECT_AFTER_LOGIN = 'redirectAfterLogin',

	// Persistent — user identity & preferences (localStorage)
	GAME_PREFERENCES = 'everytriv_game_preferences',
	PERSISTENT_REFRESH_TOKEN = 'everytriv_persistent_refresh_token',
	USER_ID = 'everytriv_user_id',

	// Persistent — game data (localStorage)
	CUSTOM_DIFFICULTIES = 'custom_difficulties',
	CUSTOM_DIFFICULTY_HISTORY = 'custom_difficulty_history',
	GAME_HISTORY = 'game_history',
	GAME_STATE = 'game_state',
	USER_PREFERENCES = 'user_preferences',

	// Persistent — UI & audio (localStorage; some keys are redux-persist style)
	AUDIO_MUTED = 'audio_muted',
	AUDIO_MUSIC_ENABLED = 'audio_music_enabled',
	AUDIO_SETTINGS = 'persist:audioSettings',
	AUDIO_SOUND_ENABLED = 'audio_sound_enabled',
	AUDIO_VOLUME = 'audio_volume',
	GAME_MODE = 'persist:gameMode',
	SCORE_HISTORY = 'score_history',
	UI_PREFERENCES = 'persist:uiPreferences',

	// Session — active gameplay
	ACTIVE_GAME_SESSION = 'active_game_session',

	// Session — multiplayer (summary payload scoped per tab)
	MULTIPLAYER_SUMMARY_PREFIX = 'multiplayer_summary_',
	MULTIPLAYER_SUMMARY_TAB_ID = 'everytriv_mp_summary_tab',

	// Diagnostics (localStorage / sessionStorage depending on caller)
	ERROR_LOG = 'error-log',
}

export const AUTH_TOKEN_CHANGED_EVENT = 'auth-token-changed';
