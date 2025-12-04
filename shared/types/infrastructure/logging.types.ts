/**
 * Shared types for logging system across client and server
 *
 * @module LoggingTypes
 * @description Logging system type definitions with modular interfaces
 * @used_by shared/services/logging
 */
import type { GameData } from '..';
import type { BillingCycle, GameMode, LogLevel, PaymentMethod, PlanType, UserRole, UserStatus } from '../../constants';
import type { BasicValue } from '../core';
import type { GameDifficulty } from '../domain/game/trivia.types';
import { User, UserPreferences } from '../domain/user/user.types';
import type { ValidationContext } from '../domain/validation.types';

// Base log entry interface
export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	meta?: LogMeta;
}

// HTTP-specific log data interface
export interface HttpLogData {
	timestamp: Date;
	level: string;
	source: string;
	userId?: string;
	sessionId?: string;
	additionalData?: Record<string, BasicValue>;
}

// Client log entry
export interface ClientLogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	meta?: HttpLogData;
}

// Client logs request
export interface ClientLogsRequest {
	logs: ClientLogEntry[];
	userId?: string;
	sessionId?: string;
}

// Log context types
export type LogContext =
	| 'API'
	| 'AUTH'
	| 'DATABASE'
	| 'USER'
	| 'PERFORMANCE'
	| 'VALIDATION'
	| 'SECURITY'
	| 'SYSTEM'
	| 'HTTP'
	| 'GAME'
	| 'PAYMENT'
	| 'TRIVIA'
	| 'CACHE'
	| 'REPOSITORY'
	| 'ANALYTICS'
	| 'PROVIDER'
	| 'STORAGE'
	| 'NAVIGATION'
	| 'LANGUAGE_TOOL'
	| 'PerformanceMonitoringInterceptor'
	| 'UserService'
	| 'AiProvidersService'
	| 'AuthenticationManager'
	| 'GoogleStrategy';

// Base logging interface - core functionality
export interface BaseLogger {
	// Session and trace management
	getSessionId(): string;
	getTraceId(): string;
	newTrace(): string;
}

// Modular logging interfaces - specific domains
export interface UserLogger {
	userInfo(message: string, meta?: LogMeta): void;
	userError(message: string, meta?: LogMeta): void;
	userWarn(message: string, meta?: LogMeta): void;
	userDebug(message: string, meta?: LogMeta): void;
	logUserActivity(userId: string, action: string, details?: LogMeta): void;
}

export interface DatabaseLogger {
	databaseError(message: string, meta?: LogMeta): void;
	databaseError(error: Error, message?: string, meta?: LogMeta): void;
	databaseInfo(message: string, meta?: LogMeta): void;
	databaseWarn(message: string, meta?: LogMeta): void;
	databaseDebug(message: string, meta?: LogMeta): void;
	databaseCreate(resource: string, meta?: LogMeta): void;
}

export interface ApiLogger {
	apiError(message: string, meta?: LogMeta): void;
	apiInfo(message: string, meta?: LogMeta): void;
	apiWarn(message: string, meta?: LogMeta): void;
	apiDebug(message: string, meta?: LogMeta): void;
	apiCreate(resource: string, meta?: LogMeta): void;
	apiRead(resource: string, meta?: LogMeta): void;
	apiUpdate(resource: string, meta?: LogMeta): void;
	apiDelete(resource: string, meta?: LogMeta): void;
	apiUpdateError(resource: string, error: string, meta?: LogMeta): void;
}

export interface PerformanceLogger {
	performance(operation: string, duration: number, meta?: LogMeta): void;
}

export interface CacheLogger {
	cacheSet(key: string, meta?: LogMeta): void;
	cacheHit(key: string, meta?: LogMeta): void;
	cacheMiss(key: string, meta?: LogMeta): void;
	cacheError(operation: string, key: string, meta?: LogMeta): void;
	cacheInfo(message: string, meta?: LogMeta): void;
	cacheDelete(key: string, meta?: LogMeta): void;
}

export interface StorageLogger {
	storageError(message: string, meta?: LogMeta): void;
	storageWarn(message: string, meta?: LogMeta): void;
}

export interface PaymentLogger {
	paymentFailed(paymentId: string, error: string, meta?: LogMeta): void;
	payment(message: string, meta?: LogMeta): void;
}

export interface SecurityLogger {
	securityLogin(message: string, meta?: LogMeta): void;
	securityLogout(message: string, meta?: LogMeta): void;
	securityDenied(message: string, meta?: LogMeta): void;
	security(type: string, message: string, meta?: LogMeta): void;
	securityWarn(message: string, meta?: LogMeta): void;
	securityError(message: string, meta?: LogMeta): void;
}

export interface ValidationLogger {
	validationError(field: string, value: string, constraint: string, meta?: LogMeta): void;
	validationWarn(field: string, value: string, constraint: string, meta?: LogMeta): void;
	validationDebug(field: string, value: string, constraint: string, meta?: LogMeta): void;
	validationInfo(field: string, value: string, constraint: string, meta?: LogMeta): void;
}

export interface SystemLogger {
	appStartup(meta?: LogMeta): void;
	systemError(error: string, meta?: LogMeta): void;
	systemError(error: Error, message?: string, meta?: LogMeta): void;
	systemInfo(message: string, meta?: LogMeta): void;
}

export interface AnalyticsLogger {
	analyticsError(operation: string, meta?: LogMeta): void;
	analyticsTrack(event: string, meta?: LogMeta): void;
	analyticsStats(type: string, meta?: LogMeta): void;
	analyticsPerformance(operation: string, meta?: LogMeta): void;
	analyticsMetrics(type: string, meta?: LogMeta): void;
	analyticsRecommendations(meta?: LogMeta): void;
}

export interface ProviderLogger {
	providerStats(provider: string, meta?: LogMeta): void;
	providerError(provider: string, error: string, meta?: LogMeta): void;
	providerSuccess(provider: string, meta?: LogMeta): void;
	providerFallback(provider: string, meta?: LogMeta): void;
	providerConfig(provider: string, meta?: LogMeta): void;
}

export interface AuthLogger {
	authLogin(message: string, meta?: LogMeta): void;
	authLogout(message: string, meta?: LogMeta): void;
	authRegister(message: string, meta?: LogMeta): void;
	authTokenRefresh(message: string, meta?: LogMeta): void;
	authProfileUpdate(message: string, meta?: LogMeta): void;
	authError(message: string, meta?: LogMeta): void;
	authError(error: Error, message?: string, meta?: LogMeta): void;
	authDebug(message: string, meta?: LogMeta): void;
	authInfo(message: string, meta?: LogMeta): void;
}

export interface LanguageToolLogger {
	languageToolServiceInit(meta?: LogMeta): void;
	languageToolDebug(message: string, meta?: LogMeta): void;
	languageToolApiRequest(url: string, method: string, meta?: LogMeta): void;
	languageToolApiError(status: number, statusText: string, meta?: LogMeta): void;
	languageToolValidation(textLength: number, language: string, matchesCount: number, meta?: LogMeta): void;
	languageToolError(errorMessage: string, meta?: LogMeta): void;
	languageToolAvailabilityCheck(isAvailable: boolean, status: number, meta?: LogMeta): void;
}

export interface NavigationLogger {
	navigationPage(path: string, meta?: LogMeta): void;
	navigationRoute(route: string, meta?: LogMeta): void;
	navigationOAuth(provider: string, meta?: LogMeta): void;
	navigationRedirect(from: string, to: string, meta?: LogMeta): void;
	navigationNotFound(path: string, meta?: LogMeta): void;
	navigationUnknownRoute(path: string, meta?: LogMeta): void;
	navigationComponentError(component: string, error: string, meta?: LogMeta): void;
}

export interface GameLogger {
	gameInfo(event: string, meta?: LogMeta): void;
	gameError(message: string, meta?: LogMeta): void;
	gameStatistics(message: string, meta?: LogMeta): void;
	gameTarget(message: string, meta?: LogMeta): void;
	gameForm(message: string, meta?: LogMeta): void;
	gameGamepad(message: string, meta?: LogMeta): void;
}

export interface MediaLogger {
	mediaWarn(message: string, meta?: LogMeta): void;
	mediaError(message: string, meta?: LogMeta): void;
	audioError(key: string, error: string, meta?: LogMeta): void;
}

/**
 * Enhanced Logger Interface - Advanced logging capabilities with structured data
 */
export interface EnhancedLogger {
	// Enhanced logging methods
	logSecurityEventEnhanced(message: string, level: 'info' | 'warn' | 'error', context?: LogMeta): void;
	logAuthenticationEnhanced(action: string, userId: string, email: string, context?: LogMeta): void;
}

// Complete logger interface - combines all basic modules
export interface Logger
	extends BaseLogger,
		UserLogger,
		DatabaseLogger,
		ApiLogger,
		PerformanceLogger,
		CacheLogger,
		StorageLogger,
		PaymentLogger,
		GameLogger,
		SecurityLogger,
		ValidationLogger,
		SystemLogger,
		AnalyticsLogger,
		ProviderLogger,
		AuthLogger,
		LanguageToolLogger,
		NavigationLogger,
		MediaLogger {}

// Enhanced logger interface - for server-side only
export interface EnhancedLoggerInterface extends Logger, EnhancedLogger {
	// Combines all logger interfaces with enhanced capabilities
}

// Log metadata type
export interface LogMeta {
	accessTokenExpiry?: string;
	action?: string;
	activeProviders?: number;
	activeUsers?: number;
	actualCount?: number;
	aiQuestion?: string;
	audioErrorCode?: number;
	amount?: number;
	answerCount?: number;
	analysis?: string;
	attempt?: number;
	authorized?: boolean;
	availableKeys?: string[];
	availableProviders?: number;
	avatar?: string;
	averageAccuracy?: number;
	averageGames?: number;
	averageScore?: number;
	avgResponseTime?: number;
	baseUrl?: string;
	body?: string;
	bodyType?: string;
	batchSize?: number;
	bestStreak?: number;
	billingCycle?: BillingCycle;
	burstCount?: number;
	canPlay?: boolean;
	canPlayFree?: boolean;
	change?: number;
	cleanedCount?: number;
	commandTimeout?: number;
	component?: string;
	componentStack?: string;
	confidence?: number;
	config?: string;
	connectTimeout?: number;
	context?: LogContext | ValidationContext;
	correctAnswer?: number;
	correctAnswers?: number;
	count?: number;
	countryCode?: string;
	credits?: number;
	customText?: string;
	data?: Record<string, unknown>;
	db?: number;
	delay?: number;
	deleted?: number;
	deletedCount?: number;
	dependencies?: string[];
	difficulty?: GameDifficulty;
	dryRun?: boolean;
	duration?: number;
	email?: string;
	enableGrammarCheck?: boolean;
	enableRefreshTokens?: boolean;
	enableSpellCheck?: boolean;
	endpoint?: string;
	endTime?: number;
	entries?: number;
	error?: string;
	errorCode?: string;
	errorDescription?: string;
	errorUri?: string;
	eventName?: string;
	errors?: string[];
	errorsCount?: number;
	errorType?: string;
	eventType?: string;
	exists?: boolean | number;
	expiresIn?: string;
	explanation?: string;
	externalService?: string;
	failedLogins?: number;
	feature?: string;
	field?: string;
	fieldCount?: number;
	fields?: string[];
	format?: string;
	formValid?: boolean;
	freeQuestions?: number;
	gameData?: GameData;
	gameMode?: GameMode;
	gameModes?: GameMode[];
	googleId?: string;
	hasApiKey?: boolean;
	hasData?: boolean;
	hasDecoratorMetadata?: boolean;
	hasErrors?: boolean;
	hasFirstName?: boolean;
	hasLastName?: boolean;
	hasAvatar?: boolean;
	hasUser?: boolean;
	hasPayload?: boolean;
	headers?: string[];
	hitRate?: number;
	host?: string;
	id?: string;
	interceptorError?: string;
	ip?: string;
	isAuthenticated?: boolean;
	isCorrect?: boolean;
	isGameActive?: boolean;
	isHardcodedPublic?: boolean;
	isPublic?: boolean;
	isValid?: boolean;
	isMuted?: boolean;
	key?: string;
	keyPrefix?: string;
	keysCount?: number;
	language?: string;
	lastErrorTime?: string;
	limit?: number;
	location?: string;
	maxQuestions?: number;
	maxRetries?: number;
	memoryDelta?: number;
	memoryUsage?: number;
	message?: string;
	method?: string;
	middleware?: string;
	middlewarePublicFlag?: boolean;
	mode?: string;
	model?: string;
	module?: string;
	musicEnabled?: boolean;
	name?: string;
	newCredits?: number;
	newFreeQuestions?: number;
	newPurchasedCredits?: number;
	newScore?: number;
	newStatus?: UserStatus;
	newTotalCredits?: number;
	offset?: number;
	oldCredits?: number;
	operationCount?: number;
	operationId?: string;
	operationKey?: string;
	options?: string;
	page?: string;
	params?: Record<string, string>;
	password?: string;
	path?: string;
	pattern?: string;
	paymentId?: string;
	paymentMethodId?: string;
	paymentMethod?: PaymentMethod;
	paymentsCount?: number;
	paymentType?: string;
	percentile?: number;
	period?: string;
	plansCount?: number;
	planType?: PlanType;
	port?: number;
	priority?: number;
	preference?: string;
	preferences?: UserPreferences | Partial<UserPreferences>;
	previousCredits?: number;
	previousProvider?: string;
	previousScore?: number;
	lastSuccessful?: string;
	price?: number;
	promptBuildTime?: number;
	provider?: string;
	providerDuration?: number;
	providers?: string[];
	costPerToken?: number;
	purchasedCredits?: number;
	query?: string | string[];
	questionsPerRequest?: number;
	questionId?: string;
	queueSize?: number;
	rank?: number;
	reason?: string;
	recommendationsCount?: number;
	redirectTo?: string;
	referrer?: string;
	refreshTokenExpiry?: string;
	remaining?: number;
	remainingInQueue?: number;
	remainingCredits?: number;
	requestCount?: number;
	requests?: number;
	requestedCount?: number;
	requiredCredits?: number;
	requiredRoles?: UserRole[];
	requireEmailVerification?: boolean;
	needsProfile?: boolean;
	responseTime?: number;
	resultsCount?: number;
	retryCount?: number;
	retryAfterSeconds?: number;
	role?: UserRole;
	roomId?: string;
	clientId?: string;
	code?: string;
	hostId?: string;
	maxPlayers?: number;
	playerCount?: number;
	scoreEarned?: number;
	currentQuestionIndex?: number;
	qualityScore?: number;
	confidenceScore?: number;
	rules?: string[];
	rulesCount?: number;
	saltRounds?: number;
	score?: number;
	search?: string;
	selectedAnswer?: string;
	sessionId?: string;
	severity?: string;
	soundEnabled?: boolean;
	src?: string;
	stack?: string;
	startTime?: number;
	status?: string | number;
	statusCode?: number;
	statusText?: string;
	storage?: string;
	success?: boolean;
	successRate?: number;
	suggestions?: string[];
	tags?: string[];
	targetUserId?: string;
	textLength?: number;
	threshold?: number;
	timeFilter?: string;
	timeframe?: string;
	timeout?: number;
	timeRemaining?: number;
	timeSincePageLoad?: string;
	timeSpent?: number;
	timestamp?: string;
	token?: string;
	currentTime?: number;
	tokenCount?: number;
	topic?: string;
	totalDifficulties?: number;
	totalErrors?: number;
	totalGames?: number;
	totalItems?: number;
	totalMiddlewares?: number;
	totalOps?: number;
	totalProviders?: number;
	gameQuestionCount?: number;
	totalRequests?: number;
	totalScore?: number;
	totalSize?: number;
	totalTopics?: number;
	totalUsers?: number;
	traceId?: string;
	transactionsCount?: number;
	ttl?: number;
	type?: string;
	uptime?: number;
	url?: string;
	user?: User;
	payloadType?: string;
	userAgent?: string;
	userId?: string;
	userInteracted?: boolean;
	usersCount?: number;
	userType?: string;
	userKeys?: string[] | Record<string, unknown>;
	payloadKeys?: string[] | Record<string, unknown>;
	value?: BasicValue;
	valueLength?: number;
	version?: string;
	volume?: number;
	masterVolume?: number;
	loop?: boolean;
	window?: number;
	queryParams?: Record<string, string | string[]>;
	hasGoogleId?: boolean;
}

/**
 * Logger Configuration
 * @used_by shared/services/logging/base-logger.service.ts
 */
export interface LoggerConfig {
	level: LogLevel;
	enableConsole: boolean;
	enableColors: boolean;
	// Server-specific options
	enableFile?: boolean;
	enablePerformanceLogging?: boolean;
	enableSecurityLogging?: boolean;
	enableUserActivityLogging?: boolean;
}

/**
 * Logger Configuration Update
 * @used_by shared/services/logging/base-logger.service.ts, shared/services/logging
 */
export interface LoggerConfigUpdate {
	level?: LogLevel;
	enableConsole?: boolean;
	enableColors?: boolean;
	// Server-specific options
	enableFile?: boolean;
	enablePerformanceLogging?: boolean;
	enableSecurityLogging?: boolean;
	enableUserActivityLogging?: boolean;
}
