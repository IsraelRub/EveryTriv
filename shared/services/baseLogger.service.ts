/**
 * Base Logger Service - Abstract implementation of modular logging interfaces
 *
 * @module BaseLoggerService
 * @description Abstract base class for all logger implementations
 */
import { LogLevel, MESSAGE_FORMATTERS, PERFORMANCE_THRESHOLDS } from '@shared/constants';
import type { Logger, LoggerConfig, LoggerConfigUpdate, LogMeta } from '@shared/types';
import { generateSessionId, generateTraceId } from '@shared/utils';

/**
 * Abstract Base Logger Service implementing all modular interfaces
 */
export abstract class BaseLoggerService implements Logger {
	protected sessionId: string;
	protected traceId: string;
	protected config: LoggerConfig;

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

	// BaseLogger implementation - internal methods should be protected
	protected abstract error(message: string, meta?: LogMeta): void;
	protected abstract warn(message: string, meta?: LogMeta): void;
	protected abstract info(message: string, meta?: LogMeta): void;
	protected abstract debug(message: string, meta?: LogMeta): void;

	private errorWithStack(error: Error, message?: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.validation.error(`${message || 'Error'}: ${error.message}`), {
			...meta,
			stack: error.stack,
		});
	}

	public getSessionId(): string {
		return this.sessionId;
	}

	public getTraceId(): string {
		return this.traceId;
	}

	public newTrace(): string {
		this.traceId = generateTraceId();
		return this.traceId;
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
	databaseError(messageOrError: string | Error, messageOrMeta?: string | LogMeta, meta?: LogMeta): void {
		if (messageOrError instanceof Error) {
			const errorMessage: string = typeof messageOrMeta === 'string' ? messageOrMeta : 'Database error';
			this.errorWithStack(messageOrError, errorMessage, meta);
		} else {
			const logMeta: LogMeta = typeof messageOrMeta === 'string' ? meta || {} : messageOrMeta || {};
			this.error(MESSAGE_FORMATTERS.databaseConnection.error(messageOrError), logMeta);
		}
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

	apiUpdateError(resource: string, error: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.api.updateError(resource, error), meta);
	}

	// PerformanceLogger implementation
	performance(operation: string, duration: number, meta?: LogMeta): void {
		const message = `${operation} (${duration}ms)`;

		if (duration > PERFORMANCE_THRESHOLDS.CRITICAL) {
			this.error(MESSAGE_FORMATTERS.performance.critical(message), meta);
		} else if (duration > PERFORMANCE_THRESHOLDS.SLOW) {
			this.warn(MESSAGE_FORMATTERS.performance.slow(message), meta);
		} else if (duration > PERFORMANCE_THRESHOLDS.ACCEPTABLE) {
			this.info(MESSAGE_FORMATTERS.performance.normal(message), meta);
		} else {
			this.debug(MESSAGE_FORMATTERS.performance.fast(message), meta);
		}
	}

	// CacheLogger implementation
	cacheSet(key: string, meta?: LogMeta): void {
		this.debug(MESSAGE_FORMATTERS.cache.set(key), meta);
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

	storageWarn(message: string, meta?: LogMeta): void {
		this.warn(MESSAGE_FORMATTERS.storage.warn(message), meta);
	}

	paymentFailed(paymentId: string, error: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.payment.failed(paymentId, error), meta);
	}

	payment(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.payment.message(message), meta);
	}

	paymentInfo(message: string, meta?: LogMeta): void {
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

	securityWarn(message: string, meta?: LogMeta): void {
		this.warn(MESSAGE_FORMATTERS.auth.denied(message), meta);
	}

	securityError(message: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.auth.error(message), meta);
	}

	// ValidationLogger implementation
	validationError(field: string, value: string, constraint: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.validation.field(field, `${value} (${constraint})`), meta);
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

	systemError(messageOrError: string | Error, messageOrMeta?: string | LogMeta, meta?: LogMeta): void {
		if (messageOrError instanceof Error) {
			const errorMessage: string = typeof messageOrMeta === 'string' ? messageOrMeta : 'System error';
			this.errorWithStack(messageOrError, errorMessage, meta);
		} else {
			const logMeta: LogMeta = typeof messageOrMeta === 'string' ? meta || {} : messageOrMeta || {};
			this.error(MESSAGE_FORMATTERS.system.error(messageOrError), logMeta);
		}
	}

	systemInfo(message: string, meta?: LogMeta): void {
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

	authError(messageOrError: string | Error, messageOrMeta?: string | LogMeta, meta?: LogMeta): void {
		if (messageOrError instanceof Error) {
			const errorMessage: string = typeof messageOrMeta === 'string' ? messageOrMeta : 'Authentication error';
			this.errorWithStack(messageOrError, errorMessage, meta);
		} else {
			const logMeta: LogMeta = typeof messageOrMeta === 'string' ? meta || {} : messageOrMeta || {};
			this.error(MESSAGE_FORMATTERS.auth.error(messageOrError), logMeta);
		}
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

	languageToolAvailabilityCheck(isAvailable: boolean, status: number, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.languageTool.availabilityCheck(isAvailable), { status, ...meta });
	}

	// DatabaseExtendedLogger implementation
	databaseCreate(resource: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.repository.create(resource, 'created'), meta);
	}

	// CacheExtendedLogger implementation
	cacheDelete(key: string, meta?: LogMeta): void {
		this.debug(MESSAGE_FORMATTERS.cache.delete(key), meta);
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
	gameInfo(event: string, meta?: LogMeta): void {
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

	// MediaLogger implementation
	mediaWarn(message: string, meta?: LogMeta): void {
		this.warn(MESSAGE_FORMATTERS.media.warn(message), meta);
	}

	mediaError(message: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.media.error('media', message), meta);
	}

	audioError(key: string, error: string, meta?: LogMeta): void {
		this.error(MESSAGE_FORMATTERS.media.audioError(key, error), meta);
	}

	// Private helper methods
	protected buildMeta(meta?: LogMeta): LogMeta {
		return {
			...meta,
			sessionId: this.sessionId,
			traceId: this.traceId,
		};
	}
}
