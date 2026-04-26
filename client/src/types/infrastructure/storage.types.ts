import type { StorageKeys } from '@/constants';

export type StorageKey =
	| StorageKeys
	| `${StorageKeys.MULTIPLAYER_SUMMARY_PREFIX}${string}`
	| `${StorageKeys.ERROR_LOG}-${string}`;

export type SessionStorageKey =
	| StorageKeys.ACTIVE_GAME_SESSION
	| StorageKeys.AUTH_TOKEN
	| StorageKeys.AUTH_USER
	| StorageKeys.MULTIPLAYER_SUMMARY_TAB_ID
	| StorageKeys.OAUTH_INITIATED_FROM_REGISTRATION
	| StorageKeys.PENDING_OPTIONAL_AVATAR_AFTER_PROFILE
	| StorageKeys.SHOW_OPTIONAL_AVATAR_ON_HOME
	| StorageKeys.REDIRECT_AFTER_LOGIN
	| StorageKeys.REFRESH_TOKEN
	| StorageKeys.REGISTRATION_EMAIL_PENDING_OPTIONAL_AVATAR;
