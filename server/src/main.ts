/**
 * EveryTriv Server Entry Point
 *
 * @module ServerMain
 * @description Main entry point for the NestJS server application
 */
// eslint-disable-next-line simple-import-sort/imports
// prettier-ignore
import 'tsconfig-paths/register';

// eslint-disable-next-line simple-import-sort/imports
// prettier-ignore
import * as dotenv from 'dotenv';

// eslint-disable-next-line simple-import-sort/imports
// prettier-ignore
dotenv.config({ override: true });

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

import { API_VERSION, HttpMethod, LOCALHOST_CONFIG, MESSAGE_FORMATTERS } from '@shared/constants';
import { AUTH_CONSTANTS } from '@shared/constants';
import { getErrorMessage, getErrorStack } from '@shared/utils';

import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';

// Environment configuration
const environment = process.env.NODE_ENV || 'production';

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
			googleClientId === 'your-google-client-id.apps.googleusercontent.com' ||
			googleClientSecret === 'GOCSPX-your-google-client-secret'
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

		app.enableCors({
			origin: process.env.CLIENT_URL || LOCALHOST_CONFIG.urls.CLIENT,
			credentials: true,
			methods: Object.values(HttpMethod),
			allowedHeaders: ['Content-Type', AUTH_CONSTANTS.AUTH_HEADER, 'X-Requested-With'],
		});

		// Enable JSON body parser - must be before other middleware
		app.use(json({ limit: '10mb' }));
		app.use(urlencoded({ extended: true, limit: '10mb', type: 'application/x-www-form-urlencoded' }));

		app.use(require('cookie-parser')());

		// Swagger API Documentation
		const config = new DocumentBuilder()
			.setTitle('EveryTriv API')
			.setDescription('API documentation for EveryTriv trivia game platform')
			.setVersion(API_VERSION)
			.addBearerAuth(
				{
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
					name: 'JWT',
					description: 'Enter JWT token',
					in: 'header',
				},
				'JWT-auth'
			)
			.build();
		const document = SwaggerModule.createDocument(app, config);
		SwaggerModule.setup('api', app, document);

		await app.listen(AppConfig.port);

		const bootDuration = Date.now() - startTime;

		console.log('Server startup complete:', {
			port: AppConfig.port,
			bootTime: `${bootDuration}ms`,
			environment: environment,
			nodeVersion: process.version,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		try {
			// Use console.error for bootstrap errors since logger might not be available
			console.error('Failed to start server:', {
				error: getErrorMessage(error),
				stack: getErrorStack(error),
				bootAttemptDuration: `${Date.now() - startTime}ms`,
			});
		} catch (shutdownError) {
			console.error('Shutdown: Failed to start server', {
				originalError: getErrorMessage(error),
				shutdownError: getErrorMessage(shutdownError),
			});
		}
		process.exit(1);
	}
}

bootstrap();
