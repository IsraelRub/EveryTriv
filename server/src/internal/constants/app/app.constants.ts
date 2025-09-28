/**
 * Server-specific application constants for EveryTriv
 * Server-only constants and configuration
 */


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

// Re-export types from centralized location
export { Environment, LogLevel } from '../../types/typeorm-compatibility.types';
