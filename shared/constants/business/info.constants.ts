/**
 * Information constants for EveryTriv with enhanced metadata
 * Defines contact info, countries, and general information
 *
 * @module InfoConstants
 * @description Information and data constants with advanced features
 * @used_by server/src/features/user/user.service.ts, client/src/components/layout, client/src/views/registration
 */

import { GAME_STATE_DEFAULTS } from '../domain/game.constants';

/**
 * Application name constant
 * @constant
 * @description Main application name used across the platform
 * @used_by server/src/config/app.config.ts, client/src/components/layout/Footer.tsx
 */
export const APP_NAME = 'EveryTriv';

/**
 * Application description constant
 * @constant
 * @description Main application description for metadata and SEO
 * @used_by server/src/config/app.config.ts, client/src/components/layout/Footer.tsx, docs/README.md
 */
export const APP_DESCRIPTION = 'Smart Trivia Platform with Custom Difficulty Levels';

/**
 * Contact information and branding constants
 * @constant
 * @description Company contact details and marketing content
 * @used_by server/src/features/user/user.service.ts, client/src/components/layout/Footer.tsx, client/src/views/user/UserProfile.tsx
 */
export const CONTACT_INFO = {
	email: 'support@everytrivia.com',
	website: 'everytrivia.com',
	description: 'Smart Trivia Platform',
	tagline: 'Challenge your knowledge with our AI-powered trivia platform',
	features: ['Custom difficulty levels', 'Unlimited topics', 'Competitive gameplay', 'AI-powered questions'],
	metadata: {
		version: '2.0.0',
		releaseDate: '2024-01-01',
		apiVersion: 'v1',
		maintenanceWindow: 'Sundays 2-4 AM UTC',
	},
} as const;

/**
 * Popular trivia topics list
 * @constant
 * @description Most popular and commonly used trivia categories
 * @used_by server/src/features/game/logic/trivia-generation.service.ts, client/src/components/game/TriviaForm.tsx, client/src/components/user/FavoriteTopics.tsx
 */
export const POPULAR_TOPICS = [
	GAME_STATE_DEFAULTS.TOPIC,
	'Science',
	'History',
	'Geography',
	'Sports',
	'Entertainment',
	'Art & Literature',
	'Technology',
	'Nature',
	'Music',
	'Movies',
	'Politics',
	'Medicine',
	'Mathematics',
	'Philosophy',
] as const;
