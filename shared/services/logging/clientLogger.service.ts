/**
 * Client Logger Implementation
 *
 * @module ClientLogger
 * @description Client-specific logger implementation with browser console logging
 * @used_by client: client/src/services/logger.service.ts
 */
import { LoggerConfigUpdate, LogMeta } from '../../types/infrastructure/logging.types';
import { BaseLoggerService } from './baseLogger.service';

/**
 * Client Logger Implementation
 * Extends BaseLoggerService with client-specific logging behavior
 */
export class ClientLogger extends BaseLoggerService {
	private readonly CSS_COLORS = {
		red: '#ff0000',
		yellow: '#ffaa00',
		blue: '#0066ff',
		green: '#00aa00',
		white: '#ffffff',
		gray: '#888888'
	} as const;

	constructor(config?: LoggerConfigUpdate) {
		super(config);
	}

	protected logError(message: string, meta?: LogMeta): void {
		console.error(`%c${message}`, `color: ${this.CSS_COLORS.red}; font-weight: bold;`, meta);
	}

	protected logWarn(message: string, meta?: LogMeta): void {
		console.warn(`%c${message}`, `color: ${this.CSS_COLORS.yellow}; font-weight: bold;`, meta);
	}

	protected logInfo(message: string, meta?: LogMeta): void {
		console.log(`%c${message}`, `color: ${this.CSS_COLORS.blue}; font-weight: bold;`, meta);
	}

	protected logDebug(message: string, meta?: LogMeta): void {
		console.debug(`%c${message}`, `color: ${this.CSS_COLORS.green}; font-weight: bold;`, meta);
	}

	// פונקציה ללוג עם צבעים בדפדפן
	public logWithColor(level: string, message: string, meta?: LogMeta): void {
		const color = this.getLevelColor(level);
		const colorCode = this.CSS_COLORS[color] || this.CSS_COLORS.white;
		
		const consoleMethod = this.getConsoleMethod(level);
		consoleMethod(`%c${message}`, `color: ${colorCode}; font-weight: bold;`, meta);
	}

	// פונקציה לקבלת צבע לפי רמת הלוג
	private getLevelColor(level: string): keyof typeof this.CSS_COLORS {
		switch (level.toUpperCase()) {
			case 'ERROR':
				return 'red';
			case 'WARN':
				return 'yellow';
			case 'INFO':
				return 'blue';
			case 'DEBUG':
				return 'green';
			default:
				return 'gray';
		}
	}

	// פונקציה לקבלת שיטת console לפי רמת הלוג
	private getConsoleMethod(level: string): (...args: unknown[]) => void {
		switch (level.toUpperCase()) {
			case 'ERROR':
				return console.error.bind(console);
			case 'WARN':
				return console.warn.bind(console);
			case 'DEBUG':
				return console.debug.bind(console);
			case 'INFO':
			default:
				return console.log.bind(console);
		}
	}

	// Override methods to use colored logging
	error(message: string, meta?: LogMeta): void {
		this.logWithColor('ERROR', message, meta);
	}

	warn(message: string, meta?: LogMeta): void {
		this.logWithColor('WARN', message, meta);
	}

	info(message: string, meta?: LogMeta): void {
		this.logWithColor('INFO', message, meta);
	}

	debug(message: string, meta?: LogMeta): void {
		this.logWithColor('DEBUG', message, meta);
	}
}

// Export singleton instance
export const clientLogger = new ClientLogger();

// Export factory function for custom configurations
export const createClientLogger = (config?: LoggerConfigUpdate) => new ClientLogger(config);
