/**
 * Application Module
 *
 * @module AppModule
 * @description Main NestJS application module with all features and middleware
 * @used_by server/main, server/config
 */
import { BadRequestException, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AUTH_CONSTANTS } from '@shared/constants';
import { ClientLogsController, MiddlewareMetricsController } from '@internal/controllers';
import { BulkOperationsMiddleware, DecoratorAwareMiddleware, RateLimitMiddleware } from '@internal/middleware';
import { StorageModule } from '@internal/modules';
import { AppController } from './app.controller';
import { GlobalExceptionFilter } from './common/globalException.filter';
import { AuthGuard, RolesGuard } from './common/guards';
import {
	CacheInterceptor,
	PerformanceMonitoringInterceptor,
	ResponseFormattingInterceptor,
} from './common/interceptors';
import { DatabaseConfig } from './config/database.config';
import {
	AnalyticsModule,
	AuthModule,
	CacheModule,
	CreditsModule,
	GameModule,
	LeaderboardModule,
	MultiplayerModule,
	PaymentModule,
	UserModule,
} from './features';
import { RedisModule } from './internal/modules/redis.module';

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
		AuthModule,
		GameModule,
		LeaderboardModule,
		MultiplayerModule,
		AnalyticsModule,
		CacheModule,
		UserModule,
		PaymentModule,
		CreditsModule,
	],
	controllers: [AppController, ClientLogsController, MiddlewareMetricsController],
	exports: [],
	providers: [
		// Global exception filter for better error logging
		{
			provide: APP_FILTER,
			useClass: GlobalExceptionFilter,
		},
		// Global decorator metadata guard for reading @Public, @Roles, @RateLimit, @Cache
		// Global cache interceptor for @Cache decorator
		{
			provide: APP_INTERCEPTOR,
			useClass: CacheInterceptor,
		},
		// Global response formatting interceptor
		{
			provide: APP_INTERCEPTOR,
			useClass: ResponseFormattingInterceptor,
		},
		// Global performance monitoring interceptor
		{
			provide: APP_INTERCEPTOR,
			useClass: PerformanceMonitoringInterceptor,
		},
		// Global authentication guard
		{
			provide: APP_GUARD,
			useClass: AuthGuard,
		},
		// Global roles guard
		{
			provide: APP_GUARD,
			useClass: RolesGuard,
		},
		// Global validation pipe for DTO validation
		{
			provide: APP_PIPE,
			useValue: new ValidationPipe({
				transform: true,
				whitelist: true,
				forbidNonWhitelisted: true,
				skipMissingProperties: false,
				skipNullProperties: false,
				skipUndefinedProperties: false,
				exceptionFactory: errors => {
					const result = errors.map(error => ({
						property: error.property,
						value: error.value,
						constraints: error.constraints,
					}));
					return new BadRequestException({
						message: 'Validation failed',
						errors: result,
					});
				},
			}),
		},
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		// Apply middleware in the order specified in the architecture diagram

		// Apply decorator-aware middleware (reads @Public, @Roles, @RateLimit metadata)
		consumer.apply(DecoratorAwareMiddleware).forRoutes('*');

		// Apply rate limiting middleware (supports both default and decorator-based)
		consumer.apply(RateLimitMiddleware).forRoutes('*');

		// Apply bulk operations middleware - optimizes bulk operations
		consumer.apply(BulkOperationsMiddleware).forRoutes('*');
	}
}
