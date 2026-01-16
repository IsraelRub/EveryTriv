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

	// Optional but recommended: JWT_REFRESH_SECRET (only if JWT refresh is used)
	// Note: Not marked as required since it might not be used in all setups

	if (missingVariables.length > 0) {
		const errorMessage = `Missing required environment variables: ${missingVariables.join(', ')}. Please set these variables before starting the application.`;
		// eslint-disable-next-line no-console
		console.error('\n❌ Environment Validation Failed:');
		// eslint-disable-next-line no-console
		console.error(errorMessage);
		// eslint-disable-next-line no-console
		console.error('\nThe application cannot start without these critical variables.\n');
		throw new Error(errorMessage);
	}
}
