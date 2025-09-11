/**
 * Information constants for EveryTriv with enhanced metadata
 * Defines contact info, countries, and general information
 *
 * @module InfoConstants
 * @description Information and data constants with advanced features
 * @used_by server: server/src/features/user/user.service.ts, client: client/src/components/layout/Footer.tsx, client/src/views/registration/RegistrationView.tsx
 */

/**
 * Application name constant
 * @constant
 * @description Main application name used across the platform
 * @used_by server: server/src/config/app.config.ts (AppConfig), client: client/src/components/layout/Footer.tsx (Footer component), shared/constants/index.ts (re-export)
 */
export const APP_NAME = 'EveryTriv';

/**
 * Application description constant
 * @constant
 * @description Main application description for metadata and SEO
 * @used_by server: server/src/config/app.config.ts (AppConfig), client: client/src/components/layout/Footer.tsx (Footer component), docs/README.md (project description)
 */
export const APP_DESCRIPTION = 'Smart Trivia Platform with Custom Difficulty Levels';

/**
 * Contact information and branding constants
 * @constant
 * @description Company contact details and marketing content
 * @used_by server: server/src/features/user/user.service.ts (user profile), client: client/src/components/layout/Footer.tsx (contact info), client/src/views/user/UserProfile.tsx (user settings)
 */
export const CONTACT_INFO = {
	/** Support email address */
	email: 'support@everytrivia.com',
	/** Main website domain */
	website: 'everytrivia.com',
	/** Platform description */
	description: 'Smart Trivia Platform',
	/** Marketing tagline */
	tagline: 'Challenge your knowledge with our AI-powered trivia platform',
	/** Key platform features */
	features: ['Custom difficulty levels', 'Unlimited topics', 'Competitive gameplay', 'AI-powered questions'],
	/** Enhanced metadata */
	metadata: {
		version: '2.0.0',
		lastUpdated: '2024-01-01',
		supportedLanguages: ['en', 'he'],
		apiVersion: 'v1',
		maintenanceWindow: 'Sundays 2-4 AM UTC',
	},
} as const;

/**
 * Supported countries list with phone prefixes
 * @constant
 * @description Countries supported for registration and payments
 * @used_by server: server/src/features/auth/auth.service.ts (user registration), client: client/src/views/registration/RegistrationView.tsx (country selection), client/src/components/user/CompleteProfile.tsx (profile completion)
 */
export const COUNTRIES = [
	{ code: 'US', name: 'United States', phonePrefix: '+1' },
	{ code: 'IL', name: 'Israel', phonePrefix: '+972' },
	{ code: 'CA', name: 'Canada', phonePrefix: '+1' },
	{ code: 'UK', name: 'United Kingdom', phonePrefix: '+44' },
	{ code: 'DE', name: 'Germany', phonePrefix: '+49' },
	{ code: 'FR', name: 'France', phonePrefix: '+33' },
	{ code: 'AU', name: 'Australia', phonePrefix: '+61' },
	{ code: 'JP', name: 'Japan', phonePrefix: '+81' },
	{ code: 'BR', name: 'Brazil', phonePrefix: '+55' },
	{ code: 'IN', name: 'India', phonePrefix: '+91' },
] as const;

/**
 * Popular trivia topics list
 * @constant
 * @description Most popular and commonly used trivia categories
 * @used_by server: server/src/features/game/logic/trivia-generation.service.ts (topic generation), client: client/src/components/game/TriviaForm.tsx (topic selection), client/src/components/user/FavoriteTopics.tsx (topic preferences)
 */
export const POPULAR_TOPICS = [
	'General Knowledge',
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

/**
 * User roles enumeration
 * @enum {string} UserRole
 * @description Available user roles in the system
 * @used_by server/src/features/user/user.service.ts, server/src/features/auth/auth.service.ts
 */
export enum UserRole {
	ADMIN = 'admin',
	GUEST = 'guest',
	USER = 'user',
	PREMIUM = 'premium',
}

/**
 * User status enumeration
 * @enum {string} UserStatus
 * @description Available user statuses in the system
 * @used_by server/src/features/user/user.service.ts, server/src/features/auth/auth.service.ts
 */
export enum UserStatus {
	ACTIVE = 'active',
	INACTIVE = 'inactive',
	SUSPENDED = 'suspended',
	BANNED = 'banned',
	PENDING_VERIFICATION = 'pending_verification',
}
