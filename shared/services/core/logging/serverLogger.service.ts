import type { EnhancedLoggerInterface, LoggerConfigUpdate, LogMeta } from '@shared/types';
import { hasProperty, hasPropertyOfType, isRecord, sanitizeLogMessage } from '@shared/utils';

import { BaseLoggerService } from './baseLogger.service';

type TraceStorage = {
	enterWith(value: string): void;
	getStore(): string | undefined;
};

type AsyncLocalStorageConstructor = new () => TraceStorage;

const isEnterWithFunction = (candidate: unknown): candidate is (value: string) => void => {
	return typeof candidate === 'function';
};

const isGetStoreFunction = (candidate: unknown): candidate is () => string | undefined => {
	return typeof candidate === 'function';
};

const isAsyncLocalStorageConstructor = (value: unknown): value is AsyncLocalStorageConstructor => {
	if (typeof value !== 'function') {
		return false;
	}

	const prototypeCandidate: unknown = value.prototype;
	if (!isRecord(prototypeCandidate)) {
		return false;
	}

	const hasEnterWith = hasPropertyOfType(prototypeCandidate, 'enterWith', isEnterWithFunction);
	const hasGetStore = hasPropertyOfType(prototypeCandidate, 'getStore', isGetStoreFunction);

	return hasEnterWith && hasGetStore;
};

const loadAsyncLocalStorage = (): AsyncLocalStorageConstructor | undefined => {
	if (typeof process === 'undefined' || !process.versions?.node) {
		return undefined;
	}

	try {
		const moduleCandidate: unknown = require('async_hooks');
		if (!hasProperty(moduleCandidate, 'AsyncLocalStorage')) {
			return undefined;
		}

		const constructorCandidate = moduleCandidate.AsyncLocalStorage;
		if (isAsyncLocalStorageConstructor(constructorCandidate)) {
			return constructorCandidate;
		}
	} catch {
		return undefined;
	}

	return undefined;
};

const createTraceStorage = (): TraceStorage => {
	const asyncLocalStorageConstructor = loadAsyncLocalStorage();
	if (asyncLocalStorageConstructor) {
		const storageInstance = new asyncLocalStorageConstructor();
		return {
			enterWith(value: string): void {
				storageInstance.enterWith(value);
			},
			getStore(): string | undefined {
				const store = storageInstance.getStore();
				if (typeof store === 'string' && store.length > 0) {
					return store;
				}

				return undefined;
			},
		};
	}

	let activeTraceId: string | undefined;

	return {
		enterWith(value: string): void {
			activeTraceId = value;
		},
		getStore(): string | undefined {
			return activeTraceId;
		},
	};
};

/**
 * Server Logger Implementation
 *
 * @module ServerLogger
 * @description Server-specific logger implementation with file logging
 */
// Conditional imports for Node.js modules
let fs: typeof import('fs') | undefined;
let path: typeof import('path') | undefined;

// Only import Node.js modules in Node.js environment
if (typeof process !== 'undefined' && process.versions?.node) {
	try {
		fs = require('fs');
		path = require('path');
	} catch {
		// Ignore import errors in browser environment
	}
}

/**
 * Server Logger Implementation
 * Extends BaseLoggerService with server-specific logging behavior
 */
export class ServerLogger extends BaseLoggerService implements EnhancedLoggerInterface {
	private readonly traceStorage: TraceStorage;
	private logDir: string;
	private logFile: string;
	private performanceMetrics: Map<string, { startTime: number; endTime?: number; duration?: number }>;
	private errorCounts: Map<string, number>;

	constructor(config?: LoggerConfigUpdate) {
		super(config);

		this.traceStorage = createTraceStorage();

		// Initialize server-specific config defaults
		this.config = {
			...this.config,
			enableFile: config?.enableFile ?? true,
			enablePerformanceLogging: config?.enablePerformanceLogging ?? true,
			enableSecurityLogging: config?.enableSecurityLogging ?? true,
			enableUserActivityLogging: config?.enableUserActivityLogging ?? true,
		};

		this.performanceMetrics = new Map();
		this.errorCounts = new Map();

		// Guard: avoid Node-only APIs when bundled in browser accidentally
		if (typeof process === 'undefined' || !path || typeof path.join !== 'function') {
			this.logDir = '';
			this.logFile = '';
			return;
		}

		this.logDir = process.env.LOG_DIR ?? 'logs';
		this.logFile = path.join(this.logDir, 'server.log');
		this.ensureLogDirectory();
		this.clearLogFile();
	}

	protected error(message: string, meta?: LogMeta): void {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		const errorType: string = typeof fullMeta?.errorType === 'string' ? fullMeta.errorType : 'unknown';
		this.errorCounts.set(errorType, (this.errorCounts.get(errorType) ?? 0) + 1);

		this.writeToFile('ERROR', sanitizedMessage, fullMeta);
	}

	protected warn(message: string, meta?: LogMeta): void {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		this.writeToFile('WARN', sanitizedMessage, fullMeta);
	}

	protected info(message: string, meta?: LogMeta): void {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		this.writeToFile('INFO', sanitizedMessage, fullMeta);
	}

	protected debug(message: string, meta?: LogMeta): void {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		if (typeof process === 'undefined' || process.env.NODE_ENV !== 'prod') {
			this.writeToFile('DEBUG', sanitizedMessage, fullMeta);
		}
	}

	private ensureLogDirectory(): void {
		if (!fs) return;

		if (!fs.existsSync(this.logDir)) {
			fs.mkdirSync(this.logDir, { recursive: true });
		}
	}

	private clearLogFile(): void {
		if (!fs) return;

		try {
			fs.writeFileSync(this.logFile, '', 'utf8');
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to clear log file:', error);
		}
	}

	private writeToFile(level: string, message: string, meta?: LogMeta): void {
		if (!fs) return;

		try {
			const now = new Date();
			const localTimestamp = now.toLocaleString('he-IL', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
			});

			const logEntry = {
				timestamp: now.toISOString(),
				level,
				message,
				meta: meta ?? {},
				sessionId: this.getSessionId(),
				traceId: this.getTraceId(),
			};

			const logLine = `[${localTimestamp}] ${level}: ${message} | ${JSON.stringify(logEntry.meta)}\n`;

			fs.appendFileSync(this.logFile, logLine, 'utf8');
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to write to log file:', error);
		}
	}

	/**
	 * Start performance tracking for an operation
	 */
	public startPerformanceTracking(operationId: string): void {
		this.performanceMetrics.set(operationId, {
			startTime: Date.now(),
		});
	}

	/**
	 * End performance tracking and log the duration
	 */
	public endPerformanceTracking(operationId: string, meta?: LogMeta): number {
		const metric = this.performanceMetrics.get(operationId);
		if (!metric) {
			this.warn(`Performance tracking not found for operation: ${operationId}`);
			return 0;
		}

		const endTime = Date.now();
		const duration = endTime - metric.startTime;

		metric.endTime = endTime;
		metric.duration = duration;

		this.info(`Performance tracking completed for ${operationId}`, {
			...meta,
			operationId,
			duration,
			startTime: metric.startTime,
			endTime,
		});

		if (this.performanceMetrics.size > 100) {
			const firstKey = this.performanceMetrics.keys().next().value;
			if (firstKey) {
				this.performanceMetrics.delete(firstKey);
			}
		}

		return duration;
	}

	/**
	 * Log security events with enhanced context
	 */
	public logSecurityEventEnhanced(event: string, level: 'info' | 'warn' | 'error', metadata?: LogMeta): void {
		if (!this.config.enableSecurityLogging) return;

		const context = {
			event,
			...metadata,
		};

		switch (level) {
			case 'info':
				this.securityLogin(event, context);
				break;
			case 'warn':
				this.securityDenied(event, context);
				break;
			case 'error':
				this.securityError(event, context);
				break;
		}
	}

	/**
	 * Log authentication events
	 */
	public logAuthenticationEnhanced(
		event: 'login' | 'logout' | 'register' | 'token_refresh' | 'password_reset',
		userId: string,
		email: string,
		metadata?: LogMeta
	): void {
		const context = {
			userId,
			email,
			event,
			...metadata,
		};

		this.securityLogin(`Authentication: ${event}`, context);
	}

	public override newTrace(): string {
		const traceId = super.newTrace();
		this.traceStorage.enterWith(traceId);
		return traceId;
	}

	public override getTraceId(): string {
		const activeTraceId = this.traceStorage.getStore();
		if (typeof activeTraceId === 'string' && activeTraceId.length > 0) {
			return activeTraceId;
		}

		return super.getTraceId();
	}

	protected override buildMeta(meta?: LogMeta): LogMeta {
		const baseMeta = super.buildMeta(meta);
		const activeTraceId = this.traceStorage.getStore();

		if (!activeTraceId) {
			return baseMeta;
		}

		return {
			...baseMeta,
			traceId: activeTraceId,
		};
	}
}

export const serverLogger = new ServerLogger();
