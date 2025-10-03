/**
 * Shared types for logging system across client and server
 *
 * @module LoggingTypes
 * @description Logging system type definitions with modular interfaces
 * @used_by shared/services/logging
 */
import { LogLevel } from '../../constants';
import { BasicValue } from '../core';
import type { ValidationContext } from '../domain/validation/validation.types';

export { LogLevel };

// Base log entry interface
export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	meta?: Record<string, unknown>;
}

// Enhanced log entry with context
export interface EnhancedLogEntry extends LogEntry {
	context?: LogContext;
	traceId?: string;
	userId?: string;
	sessionId?: string;
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
export interface ClientLogEntry extends Omit<LogEntry, 'meta'> {
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
	| 'REPOSITORY_GUARD'
	| 'PerformanceMonitoringInterceptor'
	| 'PAYMENT'
	| 'TRIVIA'
	| 'CACHE'
	| 'REPOSITORY'
	| 'ANALYTICS'
	| 'PROVIDER'
	| 'STORAGE'
	| 'NAVIGATION'
	| 'LANGUAGE_TOOL'
	| 'UserService'
	| 'AiProvidersService'
	| 'LoggingMiddleware';

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
	apiCreateError(resource: string, error: string, meta?: LogMeta): void;
	apiReadError(resource: string, error: string, meta?: LogMeta): void;
	apiUpdateError(resource: string, error: string, meta?: LogMeta): void;
	apiDeleteError(resource: string, error: string, meta?: LogMeta): void;
}

export interface PerformanceLogger {
	performance(operation: string, duration: number, meta?: LogMeta): void;
}

export interface HttpLogger {
	http(method: string, url: string, statusCode: number, duration?: number, meta?: LogMeta): void;
	httpSuccess(message: string, meta?: LogMeta): void;
	httpClientError(message: string, meta?: LogMeta): void;
	httpServerError(message: string, meta?: LogMeta): void;
}

export interface CacheLogger {
	cacheSet(key: string, meta?: LogMeta): void;
	cacheGet(key: string, meta?: LogMeta): void;
	cacheHit(key: string, meta?: LogMeta): void;
	cacheMiss(key: string, meta?: LogMeta): void;
	cacheError(operation: string, key: string, meta?: LogMeta): void;
	cacheInfo(message: string, meta?: LogMeta): void;
	cacheClear(): void;
}

export interface StorageLogger {
	storageError(message: string, meta?: LogMeta): void;
	storageInfo(message: string, meta?: LogMeta): void;
	storageWarn(message: string, meta?: LogMeta): void;
	storageDebug(message: string, meta?: LogMeta): void;
}

export interface PaymentLogger {
	paymentSuccess(paymentId: string, amount: number, meta?: LogMeta): void;
	paymentFailed(paymentId: string, error: string, meta?: LogMeta): void;
	paymentProcessing(paymentId: string, meta?: LogMeta): void;
	payment(message: string, meta?: LogMeta): void;
}

export interface SecurityLogger {
	securityLogin(message: string, meta?: LogMeta): void;
	securityLogout(message: string, meta?: LogMeta): void;
	securityDenied(message: string, meta?: LogMeta): void;
	security(type: string, message: string, meta?: LogMeta): void;
	securityInfo(message: string, meta?: LogMeta): void;
	securityWarn(message: string, meta?: LogMeta): void;
	securityError(message: string, meta?: LogMeta): void;
	audit(action: string, meta?: LogMeta): void;
}

export interface ValidationLogger {
	validationError(field: string, value: string, constraint: string, meta?: LogMeta): void;
	validationSuccess(message: string, meta?: LogMeta): void;
	validationWarn(field: string, value: string, constraint: string, meta?: LogMeta): void;
	validationDebug(field: string, value: string, constraint: string, meta?: LogMeta): void;
	validationInfo(field: string, value: string, constraint: string, meta?: LogMeta): void;
}

export interface SystemLogger {
	appStartup(meta?: LogMeta): void;
	appShutdown(meta?: LogMeta): void;
	systemError(error: string, meta?: LogMeta): void;
	systemError(error: Error, message?: string, meta?: LogMeta): void;
	system(message: string, meta?: LogMeta): void;
}

export interface BusinessLogger {
	businessInfo(message: string, meta?: LogMeta): void;
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
	languageToolInfo(message: string, meta?: LogMeta): void;
	languageToolLanguagesFetched(languagesCount: number, meta?: LogMeta): void;
	languageToolFallbackLanguages(languagesCount: number, meta?: LogMeta): void;
	languageToolAvailabilityCheck(isAvailable: boolean, status: number, meta?: LogMeta): void;
}

export interface DatabaseExtendedLogger {
	databaseCreate(resource: string, meta?: LogMeta): void;
}

export interface HttpExtendedLogger {
	logHttpRequest(method: string, url: string, statusCode: number, duration: number, meta?: LogMeta): void;
	logHttpResponse(method: string, url: string, statusCode: number, duration: number, meta?: LogMeta): void;
}

export interface CacheExtendedLogger {
	cacheDelete(key: string, meta?: LogMeta): void;
}

export interface NavigationLogger {
	navigationPage(path: string, meta?: LogMeta): void;
	navigationRoute(route: string, meta?: LogMeta): void;
	navigationOAuth(provider: string, meta?: LogMeta): void;
	navigationRedirect(from: string, to: string, meta?: LogMeta): void;
	navigationError(path: string, error: string, meta?: LogMeta): void;
	navigationNotFound(path: string, meta?: LogMeta): void;
	navigationUnknownRoute(path: string, meta?: LogMeta): void;
	navigationComponentError(component: string, error: string, meta?: LogMeta): void;
}

export interface GameLogger {
	game(event: string, meta?: LogMeta): void;
	gameError(message: string, meta?: LogMeta): void;
	gameStatistics(message: string, meta?: LogMeta): void;
	gameTarget(message: string, meta?: LogMeta): void;
	gameForm(message: string, meta?: LogMeta): void;
	gameGamepad(message: string, meta?: LogMeta): void;
	user(message: string, meta?: LogMeta): void;
}

export interface MediaLogger {
	mediaDebug(message: string, meta?: LogMeta): void;
	mediaWarn(message: string, meta?: LogMeta): void;
	mediaError(message: string, meta?: LogMeta): void;
	mediaInfo(message: string, meta?: LogMeta): void;
	audioLoad(key: string, meta?: LogMeta): void;
	audioPlay(key: string, meta?: LogMeta): void;
	audioError(key: string, error: string, meta?: LogMeta): void;
	audioFallback(key: string, meta?: LogMeta): void;
}

/**
 * Enhanced Logger Interface - Advanced logging capabilities with structured data
 */
export interface EnhancedLogger {
	// Enhanced logging methods
	logUserActivityEnhanced(action: string, userId: string, context?: Record<string, unknown>): void;
	logSecurityEventEnhanced(message: string, level: 'info' | 'warn' | 'error', context?: Record<string, unknown>): void;
	logAuthenticationEnhanced(action: string, userId: string, username: string, context?: Record<string, unknown>): void;
	logAuthorizationEnhanced(action: string, userId: string, resource: string, context?: Record<string, unknown>): void;
	logBusinessEventEnhanced(event: string, userId: string, context?: Record<string, unknown>): void;
	logValidationEnhanced(type: string, data: unknown, context?: Record<string, unknown>): void;
	logCacheEventEnhanced(event: 'hit' | 'miss' | 'error', key: string, context?: Record<string, unknown>): void;
	logDatabaseEventEnhanced(operation: string, table: string, context?: Record<string, unknown>): void;
	logErrorEnhanced(error: Error, context?: Record<string, unknown>): void;

	// Enhanced performance methods
	trackPerformanceEnhanced(operation: string, duration: number, context?: Record<string, unknown>): void;
	trackAsyncEnhanced<T>(operation: string, fn: () => Promise<T>, context?: Record<string, unknown>): Promise<T>;
	trackSyncEnhanced<T>(operation: string, fn: () => T, context?: Record<string, unknown>): T;
	getPerformanceStatsEnhanced(operation?: string): Record<string, unknown>;
	getAllPerformanceStatsEnhanced(): Record<string, unknown>;
	getSlowOperationsEnhanced(threshold?: number): Array<Record<string, unknown>>;
	setPerformanceThreshold(operation: string, threshold: number): void;
	getPerformanceThreshold(operation: string): number;
	exceedsPerformanceThreshold(operation: string, duration: number): boolean;
	getPerformanceSummaryEnhanced(): Record<string, unknown>;
	clearPerformanceDataEnhanced(): void;
	clearOperationPerformanceDataEnhanced(operation: string): void;
}

// Complete logger interface - combines all modules

export interface Logger
	extends BaseLogger,
		UserLogger,
		DatabaseLogger,
		ApiLogger,
		PerformanceLogger,
		HttpLogger,
		CacheLogger,
		StorageLogger,
		PaymentLogger,
		GameLogger,
		SecurityLogger,
		ValidationLogger,
		SystemLogger,
		BusinessLogger,
		AnalyticsLogger,
		ProviderLogger,
		AuthLogger,
		LanguageToolLogger,
		DatabaseExtendedLogger,
		HttpExtendedLogger,
		CacheExtendedLogger,
		NavigationLogger,
		MediaLogger,
		EnhancedLogger {
	// Log retrieval methods (for debugging/analytics)
	getLogs(): EnhancedLogEntry[];
	clearLogs(): void;
}

// Log metadata type
export type LogMeta = Record<string, unknown> & {
	userId?: string;
	sessionId?: string;
	traceId?: string;
	context?: LogContext | ValidationContext;
};

/**
 * Logger Configuration
 * @used_by shared/services/logging/base-logger.service.ts
 */
export interface LoggerConfig {
	level: LogLevel;
	enableConsole: boolean;
	enableColors: boolean;
}

/**
 * Logger Configuration Update
 * @used_by shared/services/logging/base-logger.service.ts, shared/services/logging/serverLogger.service.ts, shared/services/logging/clientLogger.service.ts
 */
export interface LoggerConfigUpdate {
	level?: LogLevel;
	enableConsole?: boolean;
	enableColors?: boolean;
}
