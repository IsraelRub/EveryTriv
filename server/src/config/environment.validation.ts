import { ERROR_MESSAGES } from '@shared/constants';

import { AppConfig } from './app.config';

const PLACEHOLDER_ENV_VALUES = {
	JWT_SECRET: ['change-this-in-production', 'your-jwt-secret-here'],
	SESSION_SECRET: ['everytriv-oauth-session-secret', 'your-session-secret-here'],
	COOKIE_SECRET: ['everytriv-cookie-signing-secret-change-in-production', 'your-cookie-secret-here'],
	DATABASE_PASSWORD: ['your-database-password-here'],
} as const;

function isPlaceholder(value: string, placeholders: readonly string[]): boolean {
	const normalized = value.trim().toLowerCase();
	return placeholders.some(placeholder => normalized === placeholder.toLowerCase());
}

export function validateEnvironmentVariables(): void {
	const missingVariables: string[] = [];
	const invalidVariables: string[] = [];
	const isProduction = AppConfig.isProductionRuntime;

	// Critical security variables
	const jwtSecret = process.env.JWT_SECRET;
	if (!jwtSecret) {
		missingVariables.push('JWT_SECRET');
	} else if (isPlaceholder(jwtSecret, PLACEHOLDER_ENV_VALUES.JWT_SECRET)) {
		invalidVariables.push('JWT_SECRET (placeholder value)');
	}

	// Database configuration
	const databasePassword = process.env.DATABASE_PASSWORD;
	if (!databasePassword) {
		missingVariables.push('DATABASE_PASSWORD');
	} else if (isPlaceholder(databasePassword, PLACEHOLDER_ENV_VALUES.DATABASE_PASSWORD)) {
		invalidVariables.push('DATABASE_PASSWORD (placeholder value)');
	}

	// Production-only secrets that should never use scaffold defaults
	if (isProduction) {
		const sessionSecret = process.env.SESSION_SECRET;
		if (!sessionSecret) {
			missingVariables.push('SESSION_SECRET');
		} else if (isPlaceholder(sessionSecret, PLACEHOLDER_ENV_VALUES.SESSION_SECRET)) {
			invalidVariables.push('SESSION_SECRET (placeholder value)');
		}

		const cookieSecret = process.env.COOKIE_SECRET;
		if (!cookieSecret) {
			missingVariables.push('COOKIE_SECRET');
		} else if (isPlaceholder(cookieSecret, PLACEHOLDER_ENV_VALUES.COOKIE_SECRET)) {
			invalidVariables.push('COOKIE_SECRET (placeholder value)');
		}
	}

	if (missingVariables.length > 0 || invalidVariables.length > 0) {
		const missingMessage =
			missingVariables.length > 0
				? ERROR_MESSAGES.config.MISSING_ENVIRONMENT_VARIABLES(missingVariables.join(', '))
				: '';
		const invalidMessage =
			invalidVariables.length > 0 ? `Invalid environment placeholders detected: ${invalidVariables.join(', ')}.` : '';
		const errorMessage = [missingMessage, invalidMessage].filter(Boolean).join(' ');
		// eslint-disable-next-line no-console
		console.error('\n❌ Environment Validation Failed:');
		// eslint-disable-next-line no-console
		console.error(errorMessage);
		// eslint-disable-next-line no-console
		console.error('\nThe application cannot start without these critical variables.\n');
		throw new Error(errorMessage);
	}
}
