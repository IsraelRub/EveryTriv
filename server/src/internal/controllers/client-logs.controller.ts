import { Body, Controller, Post } from '@nestjs/common';

import { LogLevel, MESSAGE_FORMATTERS } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import { ClientLogsRequest, LogMeta } from '@shared/types';

@Controller('client-logs')
export class ClientLogsController {
	@Post('batch')
	async receiveClientLogs(@Body() request: ClientLogsRequest) {
		const { logs, userId, sessionId } = request;

		// Process each log entry
		for (const logEntry of logs) {
			const meta: LogMeta = {
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

		return { processed: logs.length };
	}

	/**
	 * Map client log level string to shared LogLevel enum
	 */
	private mapClientLogLevel(level: string): LogLevel {
		switch (level.toLowerCase()) {
			case 'error':
				return LogLevel.ERROR;
			case 'warn':
			case 'warning':
				return LogLevel.WARN;
			case 'info':
				return LogLevel.INFO;
			case 'debug':
				return LogLevel.DEBUG;
			default:
				return LogLevel.INFO;
		}
	}
}
