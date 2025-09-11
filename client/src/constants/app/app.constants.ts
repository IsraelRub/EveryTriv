/**
 * Application constants for EveryTriv client
 * Re-exports shared constants and provides core application configuration
 *
 * @module AppConstants
 * @description Core application configuration constants
 * @used_by client/components, client/services, client/hooks
 */

// Re-export shared constants from the new organized structure
export {
	APP_DESCRIPTION,
	APP_NAME,
	CONTACT_INFO,
	COUNTRIES,
	PAYMENT_CONTENT,
	PAYMENT_FEATURES,
	POPULAR_TOPICS,
	SHARE_PLATFORMS,
	SOCIAL_LINKS,
} from '@shared';

// Client-specific app constants
export const CLIENT_APP_CONFIG = {
	VERSION: '2.0.0',
	ENVIRONMENT: import.meta.env.MODE || 'development',
	BUILD_TIME: import.meta.env.BUILD_TIME || new Date().toISOString(),
	FEATURES: {
		AUDIO_ENABLED: true,
		ANIMATIONS_ENABLED: true,
		OFFLINE_SUPPORT: false,
		PWA_SUPPORT: true,
	},
} as const;
