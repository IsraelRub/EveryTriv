import { LogLevel, MESSAGE_FORMATTERS, PERFORMANCE_THRESHOLDS } from '@shared/constants';
import type { Logger, LoggerConfig, LoggerConfigUpdate, LogMeta } from '@shared/types';
import { generateSessionId, generateTraceId, getErrorMessage } from '@shared/utils';

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

	private errorWithStack(error: Error, meta?: LogMeta): void {
		const contextMessage = meta?.contextMessage ?? 'Error';
		const errorMessage = getErrorMessage(error);
		const { contextMessage: _, ...restMeta } = meta ?? {};
		this.error(`${contextMessage}: ${errorMessage}`, {
			...restMeta,
			stack: error.stack,
			errorInfo: {
				message: error.message,
				type: error.constructor.name,
			},
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
	databaseError(messageOrError: string | Error, meta?: LogMeta): void {
		if (messageOrError instanceof Error) {
			this.errorWithStack(messageOrError, {
				...meta,
				contextMessage: meta?.contextMessage ?? 'Database error',
			});
		} else {
			this.error(MESSAGE_FORMATTERS.databaseConnection.error(messageOrError), meta);
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

	// paymentInfo is deprecated - use payment instead
	paymentInfo(message: string, meta?: LogMeta): void {
		this.payment(message, meta);
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

	systemError(messageOrError: string | Error, meta?: LogMeta): void {
		if (messageOrError instanceof Error) {
			this.errorWithStack(messageOrError, {
				...meta,
				contextMessage: meta?.contextMessage ?? 'System error',
			});
		} else {
			this.error(MESSAGE_FORMATTERS.system.error(messageOrError), meta);
		}
	}

	systemInfo(message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.system.message(message), meta);
	}

	// AnalyticsLogger implementation
	analyticsError(operation: string, meta?: LogMeta): void {
		this.error(`Analytics error in ${operation}`, meta);
	}

	analyticsStats(type: string, meta?: LogMeta): void {
		this.info(`Analytics stats: ${type}`, meta);
	}

	// Generic analytics logging method - replaces analyticsTrack, analyticsPerformance, analyticsMetrics, analyticsRecommendations
	analyticsLog(event: string, level: LogLevel = LogLevel.INFO, meta?: LogMeta): void {
		const message = `Analytics: ${event}`;
		switch (level) {
			case LogLevel.ERROR:
				this.error(message, meta);
				break;
			case LogLevel.WARN:
				this.warn(message, meta);
				break;
			case LogLevel.DEBUG:
				this.debug(message, meta);
				break;
			default:
				this.info(message, meta);
		}
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

	authError(messageOrError: string | Error, meta?: LogMeta): void {
		if (messageOrError instanceof Error) {
			this.errorWithStack(messageOrError, {
				...meta,
				contextMessage: meta?.contextMessage ?? 'Authentication error',
			});
		} else {
			this.error(MESSAGE_FORMATTERS.auth.error(messageOrError), meta);
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

	// NavigationLogger implementation - kept for backward compatibility as they are actively used
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

	// Generic game logging method - replaces gameTarget, gameForm, gameGamepad
	gameLog(event: string, message: string, meta?: LogMeta): void {
		this.info(MESSAGE_FORMATTERS.game.link(event), { message, ...meta });
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
