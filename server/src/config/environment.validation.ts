import { ERROR_MESSAGES } from '@shared/constants';

export function validateEnvironmentVariables(): void {
	const missingVariables: string[] = [];

	// Critical security variables
	if (!process.env.JWT_SECRET) {
		missingVariables.push('JWT_SECRET');
	}

	// Database configuration
	if (!process.env.DATABASE_PASSWORD) {
		missingVariables.push('DATABASE_PASSWORD');
	}

	if (missingVariables.length > 0) {
		const errorMessage = ERROR_MESSAGES.config.MISSING_ENVIRONMENT_VARIABLES(missingVariables.join(', '));
		// eslint-disable-next-line no-console
		console.error('\n❌ Environment Validation Failed:');
		// eslint-disable-next-line no-console
		console.error(errorMessage);
		// eslint-disable-next-line no-console
		console.error('\nThe application cannot start without these critical variables.\n');
		throw new Error(errorMessage);
	}
}
