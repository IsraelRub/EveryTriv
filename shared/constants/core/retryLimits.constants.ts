export const RETRY_LIMITS = {
	adminBootstrap: 5,
	errorBoundaryUserRetries: 2,
	gameSessionFinalization: 3,
	httpClient: 3,
	httpClientRateLimit: 5,
	languageToolHttp: 3,
	paypalHttp: 3,
	questionGeneration: 3,
	reactQueryMutations: 2,
	reactQueryQueries: 3,
	roomCodeGeneration: 10,
	userStatsPersistence: 3,
} as const;
