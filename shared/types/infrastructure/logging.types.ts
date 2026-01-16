// Shared types for logging system across client and server.
import type { GameData } from '..';
import type { GameMode, LogLevel, PaymentMethod, PlanType, UserRole, UserStatus } from '../../constants';
import type { BasicValue } from '../core';
import type { GameDifficulty } from '../domain/game/trivia.types';
import { User, UserPreferences } from '../domain/user/user.types';

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	meta?: LogMeta;
}

export interface HttpLogData {
	timestamp: Date;
	level: string;
	source: string;
	userId?: string;
	sessionId?: string;
	additionalData?: Record<string, BasicValue>;
}

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
	| 'PerformanceInterceptor'
	| 'UserService'
	| 'UserCoreService'
	| 'AiProvidersService'
	| 'AuthenticationManager'
	| 'GoogleStrategy';

export interface BaseLogger {
	// Session and trace management
	getSessionId(): string;
	getTraceId(): string;
	newTrace(): string;
}

export interface TraceStorage {
	enterWith(value: string): void;
	getStore(): string | undefined;
}

export interface UserLogger {
	userInfo(message: string, meta?: LogMeta): void;
	userError(message: string, meta?: LogMeta): void;
	userWarn(message: string, meta?: LogMeta): void;
	userDebug(message: string, meta?: LogMeta): void;
	logUserActivity(userId: string, action: string, details?: LogMeta): void;
}

export interface DatabaseLogger {
	databaseError(messageOrError: string | Error, meta?: LogMeta): void;
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
	paymentInfo(message: string, meta?: LogMeta): void;
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
	systemError(messageOrError: string | Error, meta?: LogMeta): void;
	systemInfo(message: string, meta?: LogMeta): void;
}

export interface AnalyticsLogger {
	analyticsError(operation: string, meta?: LogMeta): void;
	analyticsStats(type: string, meta?: LogMeta): void;
	analyticsLog(event: string, level?: LogLevel, meta?: LogMeta): void;
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
	authError(messageOrError: string | Error, meta?: LogMeta): void;
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
	gameLog(event: string, message: string, meta?: LogMeta): void;
}

export interface MediaLogger {
	mediaWarn(message: string, meta?: LogMeta): void;
	mediaError(message: string, meta?: LogMeta): void;
	audioError(key: string, error: string, meta?: LogMeta): void;
}

export interface EnhancedLogger {
	// Enhanced logging methods
	logSecurityEventEnhanced(message: string, level: LogLevel, context?: LogMeta): void;
	logAuthenticationEnhanced(action: string, userId: string, email: string, context?: LogMeta): void;
}

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

export interface LogUserIds {
	current?: string;
	target?: string;
	requested?: string;
	from?: string;
	to?: string;
	server?: string;
	token?: string;
}

export interface LogUserName {
	current?: {
		firstName?: string;
		lastName?: string;
	};
	old?: {
		firstName?: string;
		lastName?: string;
	};
	new?: {
		firstName?: string;
		lastName?: string;
	};
}

export interface LogUserEmails {
	current?: string;
	from?: string;
	to?: string;
	token?: string;
}

export interface LogErrorInfo {
	message?: string;
	messages?: string[];
	code?: string;
	description?: string;
	uri?: string;
	type?: string;
	interceptor?: string;
}

export interface LogHttpStatus {
	code?: number;
	text?: string;
}

export interface LogRequestCounts {
	current?: number;
	requested?: number;
	total?: number;
	provider?: number;
}

export interface LogMeta {
	action?: string;
	activeProviders?: number;
	activeUsers?: number;
	actualCount?: number;
	aiQuestion?: string;
	amount?: number;
	analysis?: string;
	answerCount?: number;
	attempt?: number;
	clampedAnswerCount?: number;
	audioErrorCode?: number;
	authorized?: boolean;
	availableKeys?: string[];
	availableProviders?: number;
	avatar?: number;
	averageAccuracy?: number;
	averageGames?: number;
	averageScore?: number;
	avgResponseTime?: number;
	baseUrl?: string;
	batchSize?: number;
	bestStreak?: number;
	body?: string;
	bodyLength?: number;
	burstCount?: number;
	canPlay?: boolean;
	canPlayFree?: boolean;
	captureId?: string;
	checking?: boolean;
	clientId?: string;
	clientMutationId?: string;
	cleanedCount?: number;
	confidence?: number;
	commandTimeout?: number;
	component?: string;
	componentStack?: string;
	config?: string;
	contextMessage?: string;
	connectTimeout?: number;
	context?: LogContext;
	contactEmail?: string;
	contactSubject?: string;
	correctAnswers?: number;
	costPerToken?: number;
	count?: number;
	countryCode?: string;
	credits?: number;
	currentQuestionIndex?: number;
	currentState?: string;
	customText?: string;
	data?: Record<string, unknown>;
	dataKeys?: string[];
	db?: number;
	delay?: number;
	deletedCount?: number;
	dependencies?: string[];
	difficulty?: GameDifficulty;
	dryRun?: boolean;
	duration?: number;
	emails?: LogUserEmails;
	endpoint?: string;
	endTime?: number;
	entries?: number;
	error?: string;
	errorCode?: string;
	errorInfo?: LogErrorInfo;
	errorType?: string;
	errorsCount?: number;
	eventId?: string;
	eventName?: string;
	eventType?: string;
	exists?: number;
	expiresIn?: string;
	explanation?: string;
	externalService?: string;
	failedLogins?: number;
	feature?: string;
	finalizedCount?: number;
	field?: keyof User | 'isActive' | 'dailyFreeQuestions' | 'remainingFreeQuestions';
	fields?: string[];
	forceFullUpdate?: boolean;
	freeQuestions?: number;
	gameData?: GameData;
	gameId?: string;
	gameMode?: GameMode;
	gameModes?: GameMode[];
	gameQuestionCount?: number;
	googleId?: string;
	hasAuthAlgo?: boolean;
	hasAuthToken?: boolean;
	hasCertUrl?: boolean;
	hasQueryToken?: boolean;
	hasTransmissionId?: boolean;
	hasTransmissionSig?: boolean;
	hasTransmissionTime?: boolean;
	headers?: string[];
	hitRate?: number;
	host?: string;
	hostId?: string;
	httpStatus?: LogHttpStatus;
	id?: string;
	ip?: string;
	isAuthenticated?: boolean;
	isCorrect?: boolean;
	isGameActive?: boolean;
	isHardcodedPublic?: boolean;
	isPublic?: boolean;
	isQuestionLimited?: boolean;
	isValid?: boolean;
	jobId?: string | number;
	key?: string;
	keyPrefix?: string;
	keysCount?: number;
	keysInvalidated?: number;
	language?: string;
	limit?: number;
	location?: string;
	maxPlayers?: number;
	maxQuestions?: number;
	maxRetries?: number;
	memoryDelta?: number;
	memoryUsage?: number;
	message?: string;
	method?: string;
	middleware?: string;
	mode?: string;
	model?: string;
	module?: string;
	name?: string;
	nameChanges?: LogUserName;
	needsProfile?: boolean;
	nodeEnv?: string;
	newCredits?: number;
	newFreeQuestions?: number;
	newPurchasedCredits?: number;
	newScore?: number;
	newState?: string;
	newStatus?: UserStatus;
	newTotalCredits?: number;
	nextQuestionIndex?: number;
	offset?: number;
	operation?: string;
	operationCount?: number;
	operationId?: string;
	operationKey?: string;
	options?: string;
	orderId?: string;
	page?: string;
	packageId?: string;
	params?: Record<string, string>;
	password?: string;
	path?: string;
	pattern?: string;
	paymentId?: string;
	paymentMethod?: PaymentMethod;
	paymentMethodId?: string;
	paymentsCount?: number;
	paypalOrderStatus?: string;
	percentile?: number;
	period?: string;
	planType?: PlanType;
	plansCount?: number;
	playerCount?: number;
	platform?: string;
	port?: number;
	preference?: string;
	preferences?: UserPreferences | Partial<UserPreferences>;
	previousCredits?: number;
	previousScore?: number;
	price?: number;
	priority?: number;
	provider?: string;
	providers?: string[];
	purchasedCredits?: number;
	qualityScore?: number;
	query?: string | string[];
	queryParams?: Record<string, string | string[]>;
	queueSize?: number;
	questionId?: string;
	questionsAnswered?: number;
	questionsPerRequest?: number;
	rank?: number;
	reason?: string;
	recommendationsCount?: number;
	redirectTo?: string;
	referrer?: string;
	remaining?: number;
	remainingCredits?: number;
	remainingInQueue?: number;
	requestCount?: number;
	requestCounts?: LogRequestCounts;
	requestedAnswerCount?: number;
	requests?: number;
	requiredCredits?: number;
	requiredRoles?: UserRole[];
	responseTime?: number;
	resultsCount?: number;
	retryAfterSeconds?: number;
	retryCount?: number;
	role?: UserRole;
	roomCode?: string;
	roomId?: string;
	rules?: string[];
	rulesCount?: number;
	saltRounds?: number;
	score?: number;
	scoreEarned?: number;
	search?: string;
	selectedAnswer?: string;
	serverKey?: string;
	sessionId?: string;
	sessionKey?: string;
	sessionScore?: number;
	severity?: string;
	shouldEndGame?: boolean;
	src?: string;
	stack?: string;
	startTime?: number;
	startedAt?: string;
	status?: string | number;
	storage?: string;
	success?: boolean;
	successRate?: number;
	suggestions?: string[];
	suggestionsCount?: number;
	tags?: string[];
	textLength?: number;
	threshold?: number;
	timeout?: number;
	timeRemaining?: number;
	timeSpent?: number;
	timestamp?: string;
	token?: string;
	tokenCount?: number;
	tokenLength?: number;
	tokenMatches?: boolean;
	topic?: string;
	total?: number;
	totalDifficulties?: number;
	totalErrors?: number;
	totalGames?: number;
	totalItems?: number;
	totalMiddlewares?: number;
	totalOps?: number;
	totalProviders?: number;
	totalRequests?: number;
	totalScore?: number;
	totalSessions?: number;
	totalSize?: number;
	totalTopics?: number;
	totalUsers?: number;
	traceId?: string;
	transactionId?: string;
	transactionsCount?: number;
	ttl?: number;
	type?: string;
	uptime?: number;
	url?: string;
	user?: User;
	userAgent?: string;
	userId?: string;
	userIdMatches?: boolean;
	userIds?: LogUserIds;
	userKeys?: string[] | Record<string, unknown>;
	userType?: string;
	usersCount?: number;
	usersReset?: number;
	validation?: string;
	validationType?: string;
	value?: BasicValue;
	valueLength?: number;
	version?: string;
	verificationStatus?: string;
	webhookEventId?: string;
}

export type LogComponentErrorFn = (component: string, error: string, meta?: LogMeta) => void;

export type LogPaymentErrorFn = (paymentId: string, error: string, meta?: LogMeta) => void;

export type LogProviderErrorFn = (provider: string, error: string, meta?: LogMeta) => void;

export type LogProviderFn = (provider: string, meta?: LogMeta) => void;

export type LogResourceErrorFn = (resource: string, error: string, meta?: LogMeta) => void;

export interface LoggerConfig {
	level: LogLevel;
	enableConsole: boolean;
	enableColors: boolean;
	enableFile?: boolean;
	enablePerformanceLogging?: boolean;
	enableSecurityLogging?: boolean;
	enableUserActivityLogging?: boolean;
}

export interface LoggerConfigUpdate {
	level?: LogLevel;
	enableConsole?: boolean;
	enableColors?: boolean;
	enableFile?: boolean;
	enablePerformanceLogging?: boolean;
	enableSecurityLogging?: boolean;
	enableUserActivityLogging?: boolean;
}

export type LogMessageFn = (message: string, meta?: LogMeta) => void;

export type LogErrorFn = (messageOrError: string | Error, meta?: LogMeta) => void;

export type LogAuthEnhancedFn = (event: string, userId: string, email: string, metadata?: LogMeta) => void;

export type LogSecurityEnhancedFn = (message: string, level: LogLevel, context?: LogMeta) => void;
