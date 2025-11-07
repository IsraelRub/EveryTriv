/**
 * Client Logger Implementation
 *
 * @module ClientLogger
 * @description Client-specific logger implementation with browser console logging
 */
import { LogMeta } from '@shared/types';
import { sanitizeLogMessage } from '@shared/utils';

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
		gray: '#888888',
	} as const;

	protected error(message: string, meta?: LogMeta): void {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		// eslint-disable-next-line no-console
		console.error(`%c${sanitizedMessage}`, `color: ${this.CSS_COLORS.red}; font-weight: bold;`, fullMeta);
	}

	protected warn(message: string, meta?: LogMeta): void {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		// eslint-disable-next-line no-console
		console.warn(`%c${sanitizedMessage}`, `color: ${this.CSS_COLORS.yellow}; font-weight: bold;`, fullMeta);
	}

	protected info(message: string, meta?: LogMeta): void {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		// eslint-disable-next-line no-console
		console.log(`%c${sanitizedMessage}`, `color: ${this.CSS_COLORS.blue}; font-weight: bold;`, fullMeta);
	}

	protected debug(message: string, meta?: LogMeta): void {
		const sanitizedMessage = sanitizeLogMessage(message);
		const fullMeta = this.buildMeta(meta);
		// eslint-disable-next-line no-console
		console.debug(`%c${sanitizedMessage}`, `color: ${this.CSS_COLORS.green}; font-weight: bold;`, fullMeta);
	}
}

// Export singleton instance
export const clientLogger = new ClientLogger();
