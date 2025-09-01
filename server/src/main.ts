/**
 * EveryTriv Server Entry Point
 *
 * @module ServerMain
 * @description Main entry point for the NestJS server application
 */
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';

import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';
import { setDatabaseLogger } from './config/database.config';
import { AUTH_CONSTANTS, MESSAGE_FORMATTERS } from './shared/constants';

/**
 * Load environment variables based on NODE_ENV
 * Attempts to load .env.prod for production, .env for development
 */
try {
	const envFile = process.env.NODE_ENV === 'prod' ? '.env.prod' : '.env';
	dotenv.config({
		path: envFile,
		debug: false,
	});
} catch (error) {
	// Continue with system environment variables if .env file doesn't exist
}

const environment = process.env.NODE_ENV || 'development';

/**
 * Bootstrap the NestJS application
 * Initializes the server with all necessary configuration
 * @returns Promise<void>
 */
async function bootstrap() {
	const startTime = Date.now();

	try {
		console.log(MESSAGE_FORMATTERS.system.startup());
		console.log(MESSAGE_FORMATTERS.system.config(), {
			DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
			REDIS_PASSWORD: process.env.REDIS_PASSWORD,
			DATABASE_HOST: process.env.DATABASE_HOST,
			REDIS_HOST: process.env.REDIS_HOST,
		});

		// Check Google OAuth configuration
		const googleClientId = process.env.GOOGLE_CLIENT_ID;
		const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

		if (
			!googleClientId ||
			!googleClientSecret ||
			googleClientId === '123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com' ||
			googleClientSecret === 'GOCSPX-abcdefghijklmnopqrstuvwxyz123456'
		) {
			console.warn(MESSAGE_FORMATTERS.oauth.credentialsMissing('GoogleOAuth'));
			console.warn(MESSAGE_FORMATTERS.oauth.warn('GoogleOAuth', 'Google OAuth authentication will be disabled.'));
			console.warn(
				MESSAGE_FORMATTERS.oauth.warn(
					'GoogleOAuth',
					'Please set valid GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables.'
				)
			);
		} else {
			console.log(MESSAGE_FORMATTERS.oauth.credentialsValid('GoogleOAuth'));
		}

		const app = await NestFactory.create<NestExpressApplication>(AppModule, {
			bufferLogs: false,
			logger: ['error', 'warn', 'log'],
		});
		console.log(MESSAGE_FORMATTERS.nestjs.appCreated());

		setDatabaseLogger();

		app.enableCors({
			origin: process.env.CLIENT_URL || 'http://localhost:5173',
			credentials: true,
			methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
			allowedHeaders: ['Content-Type', AUTH_CONSTANTS.AUTH_HEADER, 'X-Requested-With'],
		});

		app.use(require('cookie-parser')());

		await app.listen(AppConfig.port);

		const bootDuration = Date.now() - startTime;

		console.log('Server startup:', {
			bootTime: `${bootDuration}ms`,
			environment: environment,
			nodeVersion: process.version,
			sessionStart: true,
			timestamp: new Date().toISOString(),
		});

		console.log('Server bootstrap performance:', {
			duration: bootDuration,
			port: AppConfig.port,
			environment: environment,
		});

		console.log('Server startup complete:', {
			port: AppConfig.port,
			environment: environment,
			bootTime: `${bootDuration}ms`,
		});

		console.log('Server configuration:', {
			port: AppConfig.port,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		try {
			const fallback = new (require('./shared/modules/logging/logger.service').LoggerService)();
			fallback.systemError('Failed to start server', {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				bootAttemptDuration: `${Date.now() - startTime}ms`,
			});
		} catch (_) {
			console.error('Shutdown: Failed to start server', error);
		}
		process.exit(1);
	}
}

bootstrap();
