/**
 * Server Logger Implementation
 *
 * @module ServerLogger
 * @description Server-specific logger implementation with file logging
 * @used_by server: server/src/shared/modules/logging/logger.service.ts
 */
// LogLevel is not used directly in this file, removed import
import * as fs from 'fs';
import * as path from 'path';

import type { LogMeta } from '../../types';
import { LoggerConfigUpdate } from '../../types/logging.types';
import { BaseLoggerService } from './baseLogger.service';

/**
 * Server Logger Implementation
 * Extends BaseLoggerService with server-specific logging behavior
 */
export class ServerLogger extends BaseLoggerService {
	private logDir: string;
	private logFile: string;

	constructor(config?: LoggerConfigUpdate) {
		super(config);
		this.logDir = process.env.LOG_DIR || 'logs';
		this.logFile = path.join(this.logDir, 'server.log');
		this.ensureLogDirectory();
	}

	protected logError(message: string, meta?: LogMeta): void {
		console.error(message, meta);
		this.writeToFile('ERROR', message, meta);
	}

	protected logWarn(message: string, meta?: LogMeta): void {
		console.warn(message, meta);
		this.writeToFile('WARN', message, meta);
	}

	protected logInfo(message: string, meta?: LogMeta): void {
		console.log(message, meta);
		this.writeToFile('INFO', message, meta);
	}

	protected logDebug(message: string, meta?: LogMeta): void {
		if (process.env.NODE_ENV !== 'prod') {
			console.log(message, meta);
			this.writeToFile('DEBUG', message, meta);
		}
	}

	private ensureLogDirectory(): void {
		if (!fs.existsSync(this.logDir)) {
			fs.mkdirSync(this.logDir, { recursive: true });
		}
	}

	private writeToFile(level: string, message: string, meta?: LogMeta): void {
		try {
			const timestamp = new Date().toISOString();
			const logEntry = {
				timestamp,
				level,
				message,
				meta: meta || {},
				sessionId: this.getSessionId(),
				traceId: this.getTraceId(),
			};

			const logLine = `[${timestamp}] ${level}: ${message} | ${JSON.stringify(logEntry.meta)}\n`;

			fs.appendFileSync(this.logFile, logLine, 'utf8');
		} catch (error) {
			console.error('Failed to write to log file:', error);
		}
	}
}

// Export singleton instance
export const serverLogger = new ServerLogger();

// Export factory function for custom configurations
export const createServerLogger = (config?: LoggerConfigUpdate) => new ServerLogger(config);
