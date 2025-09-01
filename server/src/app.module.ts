/**
 * Application Module
 *
 * @module AppModule
 * @description Main NestJS application module with all features and middleware
 * @used_by server/main, server/config
 */
import { MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { DatabaseConfig } from './config/database.config';
import { GlobalExceptionFilter } from './config/globalException.filter';
import { RedisModule } from './config/redis.module';
import {
	AnalyticsModule,
	CacheModule,
	GameModule,
	PaymentModule,
	PointsModule,
	SubscriptionModule,
	UserModule,
} from './features';
import { AUTH_CONSTANTS } from './shared/constants';
import { ClientLogsController,LoggerService  } from './shared/controllers';
import {
	AuthMiddleware,
	BodyValidationMiddleware,
	CountryCheckMiddleware,
	LoggingMiddleware,
	RateLimitMiddleware,
	RoleCheckMiddleware,
} from './shared/middleware';
import { StorageModule } from './shared/modules';

@Module({
	imports: [
		// Redis Module
		RedisModule,
		// TypeORM Module
		TypeOrmModule.forRoot(DatabaseConfig),
		StorageModule,
		// JWT Module for middleware
		JwtModule.register({
			secret: AUTH_CONSTANTS.JWT_SECRET,
			signOptions: { expiresIn: AUTH_CONSTANTS.JWT_EXPIRATION },
		}),
		// Feature Modules - Direct imports instead of TriviaModule
		GameModule,
		AnalyticsModule,
		CacheModule,
		UserModule,
		PaymentModule,
		PointsModule,
		SubscriptionModule,
	],
	controllers: [AppController, ClientLogsController],
	exports: [],
	providers: [
		LoggerService,
		// Global exception filter for better error logging
		{
			provide: APP_FILTER,
			useClass: GlobalExceptionFilter,
		},
		// Global validation pipe for DTO validation
		{
			provide: APP_PIPE,
			useClass: ValidationPipe,
		},
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		// Apply middleware in the order specified in the architecture diagram

		// Apply logging middleware first
		consumer.apply(LoggingMiddleware).forRoutes('*');

		// Apply rate limiting middleware
		consumer.apply(RateLimitMiddleware).forRoutes('*');

		// Apply country check middleware
		consumer.apply(CountryCheckMiddleware).forRoutes('*');

		// Apply auth middleware - checks if user is logged in
		consumer.apply(AuthMiddleware).forRoutes('*');

		// Apply role check middleware - checks if admin, user, or no body
		consumer.apply(RoleCheckMiddleware).forRoutes('*');

		// Apply body validation middleware - checks if request body is valid
		consumer.apply(BodyValidationMiddleware).forRoutes('*');
	}
}
