/**
 * Client Logger Implementation
 *
 * @module ClientLogger
 * @description Client-specific logger implementation
 * @used_by client: client/src/services/logger.service.ts
 */
// LogLevel is not used directly in this file, removed import
import type { LogMeta } from '../../types';
import { LoggerConfigUpdate } from '../../types/logging.types';
import { BaseLoggerService } from './baseLogger.service';

/**
 * Client Logger Implementation
 * Extends BaseLoggerService with client-specific logging behavior
 */
export class ClientLogger extends BaseLoggerService {
	protected logError(message: string, meta?: LogMeta): void {
		console.error(message, meta);
	}

	protected logWarn(message: string, meta?: LogMeta): void {
		console.warn(message, meta);
	}

	protected logInfo(message: string, meta?: LogMeta): void {
		console.info(message, meta);
	}

	protected logDebug(message: string, meta?: LogMeta): void {
		console.debug(message, meta);
	}
}

// Export singleton instance
export const clientLogger = new ClientLogger();

// Export factory function for custom configurations
export const createClientLogger = (config?: LoggerConfigUpdate) => new ClientLogger(config);
