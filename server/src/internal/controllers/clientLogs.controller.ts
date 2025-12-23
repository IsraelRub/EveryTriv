import { Body, Controller, Post } from '@nestjs/common';

import { API_ROUTES, LogLevel, MESSAGE_FORMATTERS } from '@shared/constants';
import type { ClientLogsRequest } from '@shared/types';

import { serverLogger as logger } from '@internal/services';

@Controller(API_ROUTES.CLIENT_LOGS.BASE)
export class ClientLogsController {
	@Post(API_ROUTES.CLIENT_LOGS.BATCH)
	async receiveClientLogs(@Body() request: ClientLogsRequest): Promise<string> {
		const { logs, userId, sessionId } = request;

		// Process each log entry
		for (const logEntry of logs) {
			const meta = {
				userId: userId || logEntry.meta?.userId || 'anonymous',
				sessionId: sessionId || logEntry.meta?.sessionId || 'no-session',
				timestamp:
					logEntry.meta?.timestamp instanceof Date ? logEntry.meta.timestamp.toISOString() : new Date().toISOString(),
			};

			// Map client log level to shared LogLevel enum
			const logLevel = this.mapClientLogLevel(logEntry.level);

			switch (logLevel) {
				case LogLevel.ERROR:
					logger.apiError(MESSAGE_FORMATTERS.client.error(logEntry.message), meta);
					break;
				case LogLevel.WARN:
					logger.apiWarn(MESSAGE_FORMATTERS.client.warn(logEntry.message), meta);
					break;
				case LogLevel.INFO:
					logger.apiInfo(MESSAGE_FORMATTERS.client.info(logEntry.message), meta);
					break;
				case LogLevel.DEBUG:
					logger.apiDebug(MESSAGE_FORMATTERS.client.debug(logEntry.message), meta);
					break;
				default:
					logger.apiInfo(MESSAGE_FORMATTERS.client.info(logEntry.message), meta);
			}
		}

		return `Processed ${logs.length} log entries`;
	}

	/**
	 * Map client log level string to shared LogLevel enum
	 */
	private mapClientLogLevel(level: string): LogLevel {
		switch (level.toLowerCase()) {
			case LogLevel.ERROR:
				return LogLevel.ERROR;
			case LogLevel.WARN:
				return LogLevel.WARN;
			case LogLevel.INFO:
				return LogLevel.INFO;
			case LogLevel.DEBUG:
				return LogLevel.DEBUG;
			default:
				return LogLevel.INFO;
		}
	}
}
