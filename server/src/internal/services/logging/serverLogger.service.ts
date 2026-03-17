import { LogLevel } from '@shared/constants';
import { BaseLoggerService } from '@shared/services';
import type { LoggerConfigUpdate, LogMessageFn, LogMeta } from '@shared/types';
import { hasProperty, hasPropertyOfType, isNonEmptyString, isRecord, sanitizeLogMessage } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import type { TraceStorage } from '@internal/types';

// Conditional imports for Node.js modules
let fs: typeof import('fs') | undefined;
let path: typeof import('path') | undefined;
let asyncHooks: typeof import('async_hooks') | undefined;

// Only import Node.js modules in Node.js environment
if (typeof process !== 'undefined' && process.versions?.node) {
	try {
		fs = require('fs');
		path = require('path');
		asyncHooks = require('async_hooks');
	} catch {
		// Ignore import errors in browser environment
	}
}

export class ServerLoggerService extends BaseLoggerService {
	private readonly traceStorage: TraceStorage;
	private logDir: string;
	private logFile: string;
	private errorCounts: Map<string, number>;

	constructor(config?: LoggerConfigUpdate) {
		super(config);

		this.traceStorage = ServerLoggerService.createTraceStorage();

		// Initialize server-specific config defaults
		this.config = {
			...this.config,
			enableFile: config?.enableFile ?? true,
			enablePerformanceLogging: config?.enablePerformanceLogging ?? true,
			enableSecurityLogging: config?.enableSecurityLogging ?? true,
			enableUserActivityLogging: config?.enableUserActivityLogging ?? true,
		};

		this.errorCounts = new Map();

		// Guard: avoid Node-only APIs when bundled in browser accidentally
		if (typeof process === 'undefined' || !path || !VALIDATORS.function(path.join)) {
			this.logDir = '';
			this.logFile = '';
			return;
		}

		this.logDir = process.env.LOG_DIR ?? 'logs';
		this.logFile = path.join(this.logDir, 'server.log');
		this.ensureLogDirectory();
		this.clearLogFile();
	}

	protected error: LogMessageFn = (message, meta) => {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		const errorType: string = VALIDATORS.string(fullMeta?.errorType) ? fullMeta.errorType : 'unknown';
		this.errorCounts.set(errorType, (this.errorCounts.get(errorType) ?? 0) + 1);

		this.writeToFile(LogLevel.ERROR, sanitizedMessage, fullMeta);
	};

	protected warn: LogMessageFn = (message, meta) => {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		this.writeToFile(LogLevel.WARN, sanitizedMessage, fullMeta);
	};

	protected info: LogMessageFn = (message, meta) => {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		this.writeToFile(LogLevel.INFO, sanitizedMessage, fullMeta);
	};

	protected debug: LogMessageFn = (message, meta) => {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		if (typeof process === 'undefined' || process.env.ENABLE_DEBUG_LOGGING === 'true') {
			this.writeToFile(LogLevel.DEBUG, sanitizedMessage, fullMeta);
		}
	};

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

	private writeToFile(level: LogLevel, message: string, meta?: LogMeta): void {
		if (!fs) return;

		try {
			const now = new Date();
			const localTimestamp = now.toLocaleString(undefined, {
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

	public override newTrace(): string {
		const traceId = super.newTrace();
		this.traceStorage.enterWith(traceId);
		return traceId;
	}

	public override getTraceId(): string {
		const activeTraceId = this.traceStorage.getStore();
		if (isNonEmptyString(activeTraceId)) {
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

	private static isAsyncLocalStorageConstructor(value: unknown): value is new () => TraceStorage {
		if (!VALIDATORS.function(value)) {
			return false;
		}

		const prototypeCandidate: unknown = value.prototype;
		if (!isRecord(prototypeCandidate)) {
			return false;
		}

		return (
			hasPropertyOfType(prototypeCandidate, 'enterWith', VALIDATORS.function) &&
			hasPropertyOfType(prototypeCandidate, 'getStore', VALIDATORS.function)
		);
	}

	private static loadAsyncLocalStorageConstructor(): (new () => TraceStorage) | undefined {
		if (typeof process === 'undefined' || !process.versions?.node || !asyncHooks) {
			return undefined;
		}

		try {
			const moduleCandidate: unknown = asyncHooks;
			if (!hasProperty(moduleCandidate, 'AsyncLocalStorage')) {
				return undefined;
			}

			const constructorCandidate = moduleCandidate.AsyncLocalStorage;
			if (ServerLoggerService.isAsyncLocalStorageConstructor(constructorCandidate)) {
				return constructorCandidate;
			}
		} catch {
			return undefined;
		}

		return undefined;
	}

	private static createTraceStorage(): TraceStorage {
		const asyncLocalStorageConstructor = ServerLoggerService.loadAsyncLocalStorageConstructor();

		if (asyncLocalStorageConstructor) {
			const storageInstance = new asyncLocalStorageConstructor();
			return {
				enterWith(value: string): void {
					storageInstance.enterWith(value);
				},
				getStore(): string | undefined {
					const store = storageInstance.getStore();
					if (isNonEmptyString(store)) {
						return store;
					}

					return undefined;
				},
			};
		}

		// Fallback: use simple variable storage
		let activeTraceId: string | undefined;
		return {
			enterWith(value: string): void {
				activeTraceId = value;
			},
			getStore(): string | undefined {
				return activeTraceId;
			},
		};
	}
}

export const serverLogger = new ServerLoggerService();
