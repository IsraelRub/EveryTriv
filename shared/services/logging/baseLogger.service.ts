/**
 * Base Logger Service - Abstract implementation of modular logging interfaces
 *
 * @module BaseLoggerService
 * @description Abstract base class for all logger implementations
 * @used_by server/src/features, client/src/services
 */
import { LogLevel, MESSAGE_FORMATTERS, PERFORMANCE_THRESHOLDS } from '../../constants';
import type { EnhancedLogEntry, Logger } from '../../types';
import { LoggerConfig, LoggerConfigUpdate,LogMeta } from '../../types/infrastructure/logging.types';
import { generateSessionId, generateTraceId, sanitizeLogMessage } from '../../utils';

/**
 * Abstract Base Logger Service implementing all modular interfaces
 */
export abstract class BaseLoggerService implements Logger {
	protected sessionId: string;
	protected traceId: string;
	protected config: LoggerConfig;
	protected performanceThresholds?: Record<string, number>;
	protected performanceStats?: Record<string, any>;

	constructor(config: LoggerConfigUpdate = {}) {
		this.sessionId = generateSessionId();
		this.traceId = generateTraceId();
		this.config = {
			level: LogLevel.INFO,
			enableConsole: true,
			enableColors: true,
			...config,
		};
	}

	// Abstract logging methods - implemented by specific loggers
	protected abstract logError(message: string, meta?: LogMeta): void;
	protected abstract logWarn(message: string, meta?: LogMeta): void;
	protected abstract logInfo(message: string, meta?: LogMeta): void;
	protected abstract logDebug(message: string, meta?: LogMeta): void;

	// BaseLogger implementation
	protected error(message: string, meta?: LogMeta): void {
		const sanitizedMessage = sanitizeLogMessage(message);
		this.logError(sanitizedMessage, this.buildMeta(meta));
	}

	protected warn(message: string, meta?: LogMeta): void {
		this.logWarn(message, this.buildMeta(meta));
	}

	protected info(message: string, meta?: LogMeta): void {
		this.logInfo(message, this.buildMeta(meta));
	}

	protected debug(message: string, meta?: LogMeta): void {
		this.logDebug(message, this.buildMeta(meta));
	}

	getSessionId(): string {
		return this.sessionId;
	}

	getTraceId(): string {
		return this.traceId;
	}

	newTrace(): string {
		this.traceId = generateTraceId();
		return this.traceId;
	}

	// Configuration management
	updateConfig(newConfig: LoggerConfigUpdate): void {
		this.config = {
			...this.config,
			...newConfig,
		};

		// Validate log level
		if (newConfig.level && !Object.values(LogLevel).includes(newConfig.level)) {
			this.config.level = LogLevel.INFO;
		}

		// Ensure boolean values
		if (newConfig.enableConsole !== undefined) {
			this.config.enableConsole = Boolean(newConfig.enableConsole);
		}
		if (newConfig.enableColors !== undefined) {
			this.config.enableColors = Boolean(newConfig.enableColors);
		}
	}

	getConfig(): LoggerConfig {
		return { ...this.config };
	}

	// UserLogger implementation
	userInfo(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.user.info(message), meta);
	}

	userError(message: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.user.error(message), meta);
	}

	userWarn(message: string, meta?: LogMeta): void {
		this.warn(MESSAGE_FORMATTERS.user.warn(message), meta);
	}

	userDebug(message: string, meta?: LogMeta): void {
		this.debug(MESSAGE_FORMATTERS.user.debug(message), meta);
	}

	logUserActivity(userId: string, action: string, details?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.user.activity(action), { userId, ...details });
	}

	// DatabaseLogger implementation
	databaseError(message: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.databaseConnection.error(message), meta);
	}

	databaseInfo(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.databaseConnection.success(), { message, ...meta });
	}

	databaseWarn(message: string, meta?: LogMeta): void {
		this.warn(MESSAGE_FORMATTERS.databaseConnection.warning(message), meta);
	}

	databaseDebug(message: string, meta?: LogMeta): void {
		this.debug(MESSAGE_FORMATTERS.databaseConnection.debug(message), meta);
	}

	// ApiLogger implementation
	apiError(message: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.api.error(message), meta);
	}

	apiInfo(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.api.info(message), meta);
	}

	apiWarn(message: string, meta?: LogMeta): void {
		this.warn(MESSAGE_FORMATTERS.api.warn(message), meta);
	}

	apiDebug(message: string, meta?: LogMeta): void {
		this.debug(MESSAGE_FORMATTERS.api.debug(message), meta);
	}

	apiCreate(resource: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.api.create(resource), meta);
	}

	apiRead(resource: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.api.read(resource), meta);
	}

	apiUpdate(resource: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.api.update(resource), meta);
	}

	apiDelete(resource: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.api.delete(resource), meta);
	}

	apiCreateError(resource: string, error: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.api.createError(resource, error), meta);
	}

	apiReadError(resource: string, error: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.api.readError(resource, error), meta);
	}

	apiUpdateError(resource: string, error: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.api.updateError(resource, error), meta);
	}

	apiDeleteError(resource: string, error: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.api.deleteError(resource, error), meta);
	}

	// PerformanceLogger implementation
	performance(operation: string, duration: number, meta?: LogMeta): void {
		const message = `${operation} (${duration}ms)`;

		if (duration > PERFORMANCE_THRESHOLDS.CRITICAL) {
			this.error(MESSAGE_FORMATTERS.performance.critical(message), meta);
		} else if (duration > PERFORMANCE_THRESHOLDS.SLOW) {
			this.warn(MESSAGE_FORMATTERS.performance.slow(message), meta);
		} else if (duration > PERFORMANCE_THRESHOLDS.NORMAL) {
			this.info(MESSAGE_FORMATTERS.performance.normal(message), meta);
		} else {
			this.debug(MESSAGE_FORMATTERS.performance.fast(message), meta);
		}
	}

	// HttpLogger implementation
	http(method: string, url: string, statusCode: number, duration?: number, meta?: LogMeta): void {
		const durationText = duration ? ` (${duration}ms)` : '';
		const message = `${method} ${url} ${statusCode}${durationText}`;

		if (statusCode >= 500) {
			this.error(MESSAGE_FORMATTERS.http.serverError(message), meta);
		} else if (statusCode >= 400) {
			this.warn(MESSAGE_FORMATTERS.http.clientError(message), meta);
		} else if (statusCode >= 300) {
			this.info(MESSAGE_FORMATTERS.http.redirect(message), meta);
		} else {
			this.info(MESSAGE_FORMATTERS.http.success(message), meta);
		}
	}

	httpSuccess(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.http.success(message), meta);
	}

	httpClientError(message: string, meta?: LogMeta): void {
		this.warn(MESSAGE_FORMATTERS.http.clientError(message), meta);
	}

	httpServerError(message: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.http.serverError(message), meta);
	}

	// CacheLogger implementation
	cacheSet(key: string, meta?: LogMeta): void {
		this.debug(MESSAGE_FORMATTERS.cache.set(key), meta);
	}

	cacheGet(key: string, meta?: LogMeta): void {
		this.debug(MESSAGE_FORMATTERS.cache.get(key), meta);
	}

	cacheHit(key: string, meta?: LogMeta): void {
		this.debug(MESSAGE_FORMATTERS.cache.hit(key), meta);
	}

	cacheMiss(key: string, meta?: LogMeta): void {
		this.debug(MESSAGE_FORMATTERS.cache.miss(key), meta);
	}

	cacheInfo(message: string, meta?: LogMeta): void {
		this.info(`Cache: ${message}`, meta);
	}

	cacheError(operation: string, key: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.cache.error(operation, key), meta);
	}

	// StorageLogger implementation
	storageError(message: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.storage.error(message), meta);
	}

	storageInfo(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.storage.info(message), meta);
	}

	storageWarn(message: string, meta?: LogMeta): void {
		this.warn(MESSAGE_FORMATTERS.storage.warn(message), meta);
	}

	storageDebug(message: string, meta?: LogMeta): void {
		this.debug(MESSAGE_FORMATTERS.storage.debug(message), meta);
	}

	// PaymentLogger implementation
	paymentSuccess(paymentId: string, amount: number, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.payment.success(paymentId, amount), meta);
	}

	paymentFailed(paymentId: string, error: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.payment.failed(paymentId, error), meta);
	}

	paymentProcessing(paymentId: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.payment.processing(paymentId), meta);
	}

	payment(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.payment.message(message), meta);
	}

	// SecurityLogger implementation
	securityLogin(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.auth.login(message), meta);
	}

	securityLogout(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.auth.logout(message), meta);
	}

	securityDenied(message: string, meta?: LogMeta): void {
		this.warn(MESSAGE_FORMATTERS.auth.denied(message), meta);
	}

	security(type: string, message: string, meta?: LogMeta): void {
		this.info(`${type}: ${message}`, meta);
	}

	securityInfo(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.auth.info(message), meta);
	}

	securityWarn(message: string, meta?: LogMeta): void {
		this.warn(MESSAGE_FORMATTERS.auth.denied(message), meta);
	}

	securityError(message: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.auth.error(message), meta);
	}

	audit(action: string, meta?: LogMeta): void {
		this.info(`Audit: ${action}`, meta);
	}

	// ValidationLogger implementation
	validationError(field: string, value: string, constraint: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.validation.field(field, `${value} (${constraint})`), meta);
	}

	validationSuccess(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.validation.success(message), meta);
	}

	validationWarn(field: string, value: string, constraint: string, meta?: LogMeta): void {
		this.warn(MESSAGE_FORMATTERS.validation.field(field, `${value} (${constraint})`), meta);
	}

	validationDebug(field: string, value: string, constraint: string, meta?: LogMeta): void {
		this.debug(MESSAGE_FORMATTERS.validation.field(field, `${value} (${constraint})`), meta);
	}

	validationInfo(field: string, value: string, constraint: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.validation.field(field, `${value} (${constraint})`), meta);
	}

	// SystemLogger implementation
	appStartup(meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.system.appStartup(), meta);
	}

	appShutdown(meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.system.appShutdown(), meta);
	}

	systemError(error: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.system.error(error), meta);
	}

	system(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.system.message(message), meta);
	}

	// AnalyticsLogger implementation
	analyticsError(operation: string, meta?: LogMeta): void {
		this.error(`Analytics error in ${operation}`, meta);
	}

	analyticsTrack(event: string, meta?: LogMeta): void {
		this.info(`Analytics track: ${event}`, meta);
	}

	analyticsStats(type: string, meta?: LogMeta): void {
		this.info(`Analytics stats: ${type}`, meta);
	}

	analyticsPerformance(operation: string, meta?: LogMeta): void {
		this.info(`Analytics performance: ${operation}`, meta);
	}

	analyticsMetrics(type: string, meta?: LogMeta): void {
		this.info(`Analytics metrics: ${type}`, meta);
	}

	analyticsRecommendations(meta?: LogMeta): void {
		this.info('Analytics recommendations', meta);
	}

	// ProviderLogger implementation
	providerStats(provider: string, meta?: LogMeta): void {
		this.info(`Provider stats: ${provider}`, meta);
	}

	providerError(provider: string, error: string, meta?: LogMeta): void {
		this.error(`Provider error in ${provider}: ${error}`, meta);
	}

	providerSuccess(provider: string, meta?: LogMeta): void {
		this.info(`Provider success: ${provider}`, meta);
	}

	providerFallback(provider: string, meta?: LogMeta): void {
		this.warn(`Provider fallback: ${provider}`, meta);
	}

	providerConfig(provider: string, meta?: LogMeta): void {
		this.info(`Provider config: ${provider}`, meta);
	}

	// AuthLogger implementation

	authLogin(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.auth.login(message), meta);
	}

	authLogout(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.auth.logout(message), meta);
	}

	authRegister(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.auth.register(message), meta);
	}

	authTokenRefresh(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.auth.tokenRefresh(message), meta);
	}

	authProfileUpdate(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.auth.profileUpdate(message), meta);
	}

	authError(message: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.auth.error(message), meta);
	}

	authDebug(message: string, meta?: LogMeta): void {
		this.debug(MESSAGE_FORMATTERS.auth.debug(message), meta);
	}

	authInfo(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.auth.info(message), meta);
	}

	// LanguageToolLogger implementation
	languageToolServiceInit(meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.languageTool.serviceInit(), meta);
	}

	languageToolDebug(message: string, meta?: LogMeta): void {
		this.debug(MESSAGE_FORMATTERS.languageTool.debug(message), meta);
	}

	languageToolApiRequest(url: string, method: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.languageTool.apiRequest(`${method} ${url}`), meta);
	}

	languageToolApiError(status: number, statusText: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.languageTool.apiError(`${status} ${statusText}`, `${status} ${statusText}`), meta);
	}

	languageToolValidation(textLength: number, language: string, matchesCount: number, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.languageTool.validation(`${textLength} chars, ${language}`, matchesCount), meta);
	}

	languageToolError(errorMessage: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.languageTool.error(errorMessage), meta);
	}

	languageToolInfo(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.languageTool.info(message), meta);
	}

	languageToolLanguagesFetched(languagesCount: number, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.languageTool.languagesFetched(languagesCount), meta);
	}

	languageToolFallbackLanguages(languagesCount: number, meta?: LogMeta): void {
		this.warn(MESSAGE_FORMATTERS.languageTool.fallbackLanguages([`${languagesCount} languages`]), meta);
	}

	languageToolAvailabilityCheck(isAvailable: boolean, status: number, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.languageTool.availabilityCheck(isAvailable), { status, ...meta });
	}

	// DatabaseExtendedLogger implementation
	databaseCreate(resource: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.repository.create(resource, 'created'), meta);
	}

	// HttpExtendedLogger implementation
	logHttpRequest(method: string, url: string, statusCode: number, duration: number, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.http.success(`${method} ${url} ${statusCode} (${duration}ms)`), meta);
	}

	logHttpResponse(method: string, url: string, statusCode: number, duration: number, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.http.success(`${method} ${url} ${statusCode} (${duration}ms)`), meta);
	}

	// CacheExtendedLogger implementation
	cacheDelete(key: string, meta?: LogMeta): void {
		this.debug(MESSAGE_FORMATTERS.cache.delete(key), meta);
	}

	cacheClear(): void {
		this.info('Cache cleared', {});
	}

	// BusinessLogger implementation
	businessInfo(message: string, meta?: LogMeta): void {
		this.info(`Business: ${message}`, meta);
	}

	// NavigationLogger implementation
	navigationPage(path: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.navigation.page(path), meta);
	}

	navigationRoute(route: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.navigation.route(route), meta);
	}

	navigationOAuth(provider: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.navigation.oauth(provider), meta);
	}

	navigationRedirect(from: string, to: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.navigation.redirect(from, to), meta);
	}

	navigationError(path: string, error: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.navigation.error(path, error), meta);
	}

	navigationNotFound(path: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.navigation.notFound(path), meta);
	}

	navigationUnknownRoute(path: string, meta?: LogMeta): void {
		this.warn(MESSAGE_FORMATTERS.navigation.unknownRoute(path), meta);
	}

	navigationComponentError(component: string, error: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.navigation.componentError(component, error), meta);
	}

	// GameLogger implementation
	game(event: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.game.link(event), meta);
	}

	gameError(message: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.game.error(message), meta);
	}

	gameStatistics(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.game.statistics(message), meta);
	}

	gameTarget(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.game.target(message), meta);
	}

	gameForm(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.game.form(message), meta);
	}

	gameGamepad(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.game.gamepad(message), meta);
	}

	user(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.user.info(message), meta);
	}

	// MediaLogger implementation
	mediaDebug(message: string, meta?: LogMeta): void {
		this.debug(MESSAGE_FORMATTERS.media.debug(message), meta);
	}

	mediaWarn(message: string, meta?: LogMeta): void {
		this.warn(MESSAGE_FORMATTERS.media.warn(message), meta);
	}

	mediaError(message: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.media.error('media', message), meta);
	}

	mediaInfo(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.media.info(message), meta);
	}

	audioLoad(key: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.media.audioLoad(key), meta);
	}

	audioPlay(key: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.media.audioPlay(key), meta);
	}

	audioError(key: string, error: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.media.audioError(key, error), meta);
	}

	audioFallback(key: string, meta?: LogMeta): void {
		this.warn(MESSAGE_FORMATTERS.media.audioFallback(key), meta);
	}

	// Additional utility methods
	errorWithStack(error: Error, message?: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.validation.error(`${message || 'Error'}: ${error.message}`), {
			...meta,
			stack: error.stack,
		});
	}

	// Log retrieval methods (for debugging/analytics)
	getLogs(): EnhancedLogEntry[] {
		return [];
	}

	// Function for automatic logger cleanup
	public clearLogs(): void {
		// Clear session and trace IDs
		this.sessionId = generateSessionId();
		this.traceId = generateTraceId();

		// Log the clearing action
		this.info('🧹 Logger cleared - new session started', {
			newSessionId: this.sessionId,
			newTraceId: this.traceId,
		});
	}

	// Enhanced logging methods - default implementations
	logUserActivityEnhanced(action: string, userId: string, context?: Record<string, unknown>): void {
		this.logUserActivity(action, userId, context);
	}

	logSecurityEventEnhanced(message: string, level: 'info' | 'warn' | 'error', context?: Record<string, unknown>): void {
		switch (level) {
			case 'info':
				this.securityInfo(message, context);
				break;
			case 'warn':
				this.securityWarn(message, context);
				break;
			case 'error':
				this.securityError(message, context);
				break;
		}
	}

	logAuthenticationEnhanced(action: string, userId: string, username: string, context?: Record<string, unknown>): void {
		this.authInfo(`Authentication: ${action}`, {
			userId,
			username,
			...context,
		});
	}

	logAuthorizationEnhanced(action: string, userId: string, resource: string, context?: Record<string, unknown>): void {
		this.authInfo(`Authorization: ${action}`, {
			userId,
			resource,
			...context,
		});
	}

	logBusinessEventEnhanced(event: string, userId: string, context?: Record<string, unknown>): void {
		this.businessInfo(`Business Event: ${event}`, {
			userId,
			...context,
		});
	}

	logValidationEnhanced(type: string, data: unknown, context?: Record<string, unknown>): void {
		this.validationInfo(`Validation: ${type}`, 'validation', 'enhanced', {
			data,
			...context,
		});
	}

	logCacheEventEnhanced(event: 'hit' | 'miss' | 'error', key: string, context?: Record<string, unknown>): void {
		this.cacheInfo(`Cache ${event}: ${key}`, {
			event,
			key,
			...context,
		});
	}

	logDatabaseEventEnhanced(operation: string, table: string, context?: Record<string, unknown>): void {
		this.databaseInfo(`Database ${operation}: ${table}`, {
			operation,
			table,
			...context,
		});
	}

	logErrorEnhanced(error: Error, context?: Record<string, unknown>): void {
		this.errorWithStack(error, 'Enhanced Error', context);
	}

	// Enhanced performance methods - default implementations
	trackPerformanceEnhanced(operation: string, duration: number, context?: Record<string, unknown>): void {
		this.performance(`Performance: ${operation}`, duration, {
			operation,
			...context,
		});
	}

	async trackAsyncEnhanced<T>(operation: string, fn: () => Promise<T>, context?: Record<string, unknown>): Promise<T> {
		const start = Date.now();
		try {
			const result = await fn();
			const duration = Date.now() - start;
			this.trackPerformanceEnhanced(operation, duration, { ...context, success: true });
			return result;
		} catch (error) {
			const duration = Date.now() - start;
			this.trackPerformanceEnhanced(operation, duration, {
				...context,
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	trackSyncEnhanced<T>(operation: string, fn: () => T, context?: Record<string, unknown>): T {
		const start = Date.now();
		try {
			const result = fn();
			const duration = Date.now() - start;
			this.trackPerformanceEnhanced(operation, duration, { ...context, success: true });
			return result;
		} catch (error) {
			const duration = Date.now() - start;
			this.trackPerformanceEnhanced(operation, duration, {
				...context,
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	getPerformanceStatsEnhanced(operation?: string): Record<string, unknown> {
		return { operation, message: 'Performance stats not implemented in base logger' };
	}

	getAllPerformanceStatsEnhanced(): Record<string, unknown> {
		return { message: 'Performance stats not implemented in base logger' };
	}

	getSlowOperationsEnhanced(threshold?: number): Array<Record<string, unknown>> {
		return [{ message: 'Slow operations not implemented in base logger', threshold }];
	}

	setPerformanceThreshold(operation: string, threshold: number): void {
		// Store threshold for operation
		this.performanceThresholds = this.performanceThresholds || {};
		this.performanceThresholds[operation] = threshold;
	}

	getPerformanceThreshold(operation: string): number {
		if (this.performanceThresholds && this.performanceThresholds[operation]) {
			return this.performanceThresholds[operation];
		}
		return 1000; // Default threshold
	}

	exceedsPerformanceThreshold(operation: string, duration: number): boolean {
		return duration > this.getPerformanceThreshold(operation);
	}

	getPerformanceSummaryEnhanced(): Record<string, unknown> {
		return { message: 'Performance summary not implemented in base logger' };
	}

	clearPerformanceDataEnhanced(): void {
		// Default implementation - no-op
	}

	clearOperationPerformanceDataEnhanced(operation: string): void {
		// Clear performance data for specific operation
		if (this.performanceStats) {
			delete this.performanceStats[operation];
		}
	}

	// Private helper methods
	private buildMeta(meta?: LogMeta): LogMeta {
		return {
			...meta,
			sessionId: this.sessionId,
			traceId: this.traceId,
		};
	}
}
