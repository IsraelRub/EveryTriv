import { Controller, Post, Body } from '@nestjs/common';
import { MESSAGE_FORMATTERS, serverLogger, ClientLogsRequest, LogLevel, LogMeta } from '@shared';

@Controller('client-logs')
export class ClientLogsController {

	@Post('batch')
	async receiveClientLogs(@Body() request: ClientLogsRequest) {
		const { logs, userId, sessionId } = request;

		// Process each log entry
		for (const logEntry of logs) {
			const meta: LogMeta = {
				source: 'client',
				userId: userId || 'anonymous',
				sessionId: sessionId || 'no-session',
				timestamp: new Date().toISOString(),
				level: logEntry.meta?.level || 'info',
				...logEntry.meta,
			};

			// Map client log level to shared LogLevel enum
			const logLevel = this.mapClientLogLevel(logEntry.level);

			switch (logLevel) {
				case LogLevel.ERROR:
					serverLogger.apiError(MESSAGE_FORMATTERS.client.error(logEntry.message), meta);
					break;
				case LogLevel.WARN:
					serverLogger.apiWarn(MESSAGE_FORMATTERS.client.warn(logEntry.message), meta);
					break;
				case LogLevel.INFO:
					serverLogger.apiInfo(MESSAGE_FORMATTERS.client.info(logEntry.message), meta);
					break;
				case LogLevel.DEBUG:
					serverLogger.apiDebug(MESSAGE_FORMATTERS.client.debug(logEntry.message), meta);
					break;
				default:
					serverLogger.apiInfo(MESSAGE_FORMATTERS.client.info(logEntry.message), meta);
			}
		}

		return { success: true, processed: logs.length };
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
