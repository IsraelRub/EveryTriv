import { LogLevel } from '@shared/constants';
import { BaseLoggerService } from '@shared/services';
import type { LoggerConfigUpdate, LogMessageFn, LogMeta } from '@shared/types';
import {
	formatDateTime,
	hasProperty,
	hasPropertyOfType,
	isNonEmptyString,
	isRecord,
	sanitizeLogMessage,
} from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { SERVER_LOG_FILE_DEFAULTS } from '@internal/constants';
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

function envFlagTrue(raw: string | undefined): boolean {
	if (raw === undefined) return false;
	const v = raw.trim().toLowerCase();
	return v === '1' || v === 'true' || v === 'yes';
}

function parsePositiveIntEnv(raw: string | undefined, fallback: number, maxCap: number): number {
	if (raw === undefined || raw.trim() === '') return fallback;
	const n = Number.parseInt(raw, 10);
	if (!Number.isFinite(n) || n < 1) return fallback;
	return Math.min(n, maxCap);
}

function parseNonNegativeIntEnv(raw: string | undefined, fallback: number): number {
	if (raw === undefined || raw.trim() === '') return fallback;
	const n = Number.parseInt(raw, 10);
	if (!Number.isFinite(n) || n < 0) return fallback;
	return n;
}

class ServerLoggerService extends BaseLoggerService {
	private readonly traceStorage: TraceStorage;
	private logDir: string;
	private logFile: string;
	private errorCounts: Map<string, number>;
	private logMaxBytes: number;
	private logMaxArchivedFiles: number;

	constructor(config?: LoggerConfigUpdate) {
		super(config);
		this.traceStorage = ServerLoggerService.createTraceStorage();
		this.config = {
			...this.config,
			enableFile: config?.enableFile ?? true,
			enablePerformanceLogging: config?.enablePerformanceLogging ?? true,
			enableSecurityLogging: config?.enableSecurityLogging ?? true,
			enableUserActivityLogging: config?.enableUserActivityLogging ?? true,
		};
		this.errorCounts = new Map();
		this.logMaxBytes = SERVER_LOG_FILE_DEFAULTS.maxFileBytes;
		this.logMaxArchivedFiles = SERVER_LOG_FILE_DEFAULTS.maxArchivedFiles;
		if (typeof process === 'undefined' || !path || !VALIDATORS.function(path.join)) {
			this.logDir = '';
			this.logFile = '';
			return;
		}
		this.logDir = process.env.LOG_DIR ?? 'logs';
		this.logFile = path.join(this.logDir, 'server.log');
		this.logMaxBytes = parseNonNegativeIntEnv(process.env.LOG_MAX_FILE_BYTES, SERVER_LOG_FILE_DEFAULTS.maxFileBytes);
		this.logMaxArchivedFiles = parsePositiveIntEnv(
			process.env.LOG_MAX_ARCHIVED_FILES,
			SERVER_LOG_FILE_DEFAULTS.maxArchivedFiles,
			SERVER_LOG_FILE_DEFAULTS.maxArchivedFilesCap
		);
		this.ensureLogDirectory();
		const clearOnStart = envFlagTrue(process.env.LOG_CLEAR_ON_START);
		if (clearOnStart) {
			this.clearLogFile();
		}
	}

	protected error: LogMessageFn = (message, meta) => {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		const errorType: string = VALIDATORS.string(fullMeta?.errorType) ? fullMeta.errorType : 'unknown';
		this.errorCounts.set(errorType, (this.errorCounts.get(errorType) ?? 0) + 1);
		this.writeToFile(LogLevel.ERROR, sanitizedMessage, fullMeta);
	};

	protected warn: LogMessageFn = (message, meta) => {
		this.writeToFile(LogLevel.WARN, sanitizeLogMessage(message), this.buildMeta(meta));
	};

	protected info: LogMessageFn = (message, meta) => {
		this.writeToFile(LogLevel.INFO, sanitizeLogMessage(message), this.buildMeta(meta));
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
		if (!fs || !this.logFile) return;
		try {
			fs.writeFileSync(this.logFile, '', 'utf8');
		} catch {
			return;
		}
	}

	private archivedLogPath(index: number): string {
		return `${this.logFile}.${index}`;
	}

	private rotateActiveLogIfNeeded(nextChunkBytes: number): void {
		if (!fs || !this.logFile || this.logMaxBytes <= 0) return;
		let currentSize = 0;
		try {
			if (!fs.existsSync(this.logFile)) return;
			currentSize = fs.statSync(this.logFile).size;
		} catch {
			return;
		}
		if (currentSize + nextChunkBytes <= this.logMaxBytes) return;
		const max = this.logMaxArchivedFiles;
		try {
			if (fs.existsSync(this.archivedLogPath(max))) {
				fs.unlinkSync(this.archivedLogPath(max));
			}
			for (let i = max - 1; i >= 1; i--) {
				const from = this.archivedLogPath(i);
				const to = this.archivedLogPath(i + 1);
				if (fs.existsSync(from)) {
					fs.renameSync(from, to);
				}
			}
			if (fs.existsSync(this.logFile)) {
				fs.renameSync(this.logFile, this.archivedLogPath(1));
			}
		} catch {
			return;
		}
	}

	private writeToFile(level: LogLevel, message: string, meta?: LogMeta): void {
		if (!this.config.enableFile || !fs || !this.logFile) return;
		const now = new Date();
		const localTimestamp = formatDateTime(now, '', true);
		const logEntry = {
			timestamp: now.toISOString(),
			level,
			message,
			meta: meta ?? {},
			sessionId: this.sessionId,
			traceId: this.traceId,
		};
		const logLine = `[${localTimestamp}] ${level}: ${message} | ${JSON.stringify(logEntry.meta)}\n`;
		const lineBytes = Buffer.byteLength(logLine, 'utf8');
		this.rotateActiveLogIfNeeded(lineBytes);
		try {
			fs.appendFileSync(this.logFile, logLine, 'utf8');
		} catch {
			return;
		}
	}

	public override newTrace(): string {
		const traceId = super.newTrace();
		this.traceStorage.enterWith(traceId);
		return traceId;
	}

	public override get traceId(): string {
		const activeTraceId = this.traceStorage.getStore();
		return isNonEmptyString(activeTraceId) ? activeTraceId : super.traceId;
	}

	protected override buildMeta(meta?: LogMeta): LogMeta {
		const baseMeta = super.buildMeta(meta);
		const activeTraceId = this.traceStorage.getStore();
		return activeTraceId ? { ...baseMeta, traceId: activeTraceId } : baseMeta;
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
			return ServerLoggerService.isAsyncLocalStorageConstructor(constructorCandidate)
				? constructorCandidate
				: undefined;
		} catch {
			return undefined;
		}
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
					return isNonEmptyString(store) ? store : undefined;
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
	}
}

export const serverLogger = new ServerLoggerService();
