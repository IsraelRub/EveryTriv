/**
 * Server-specific application constants for EveryTriv
 * Server-only constants and configuration
 */

// Re-export shared constants
// export {
// 	APP_DESCRIPTION,
// 	APP_NAME,
// 	CONTACT_INFO,
// 	COUNTRIES,
// 	POPULAR_TOPICS,
// 	DEFAULT_PORTS,
// } from '@shared'; // Commented out for TypeORM CLI compatibility

// Re-export constants from centralized location
export const APP_DESCRIPTION = 'EveryTriv - AI-Powered Trivia Game';
export const APP_NAME = 'EveryTriv';
export const CONTACT_INFO = {
	email: 'support@everytriv.com',
	website: 'https://everytriv.com',
};
export const COUNTRIES = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE'];
export const POPULAR_TOPICS = [
	'General Knowledge',
	'Science',
	'History',
	'Geography',
	'Sports',
	'Entertainment',
	'Technology',
	'Literature',
];
export const DEFAULT_PORTS = {
	SERVER: 3001,
	DATABASE: 5432,
	REDIS: 6379,
};

// Re-export types from centralized location
export { Environment, LogLevel } from '../../types/typeorm-compatibility.types';
