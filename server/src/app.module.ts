import { BadRequestException, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, Reflector } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AUTH_CONSTANTS } from '@shared/constants';

import { AppConfig, DatabaseConfig } from '@config';
import { HealthController, MetricsController } from '@internal/controllers';
import { RateLimitMiddleware } from '@internal/middleware';
import { CacheModule, CacheService, StorageModule } from '@internal/modules';

import { AppController } from './app.controller';
import { GlobalExceptionFilter } from './common/globalException.filter';
import { AuthGuard, RolesGuard } from './common/guards';
import { CacheInterceptor, PerformanceInterceptor, ResponseFormatter } from './common/interceptors';
import {
	AdminModule,
	AnalyticsModule,
	AuthModule,
	CreditsModule,
	GameModule,
	MultiplayerModule,
	PaymentModule,
	UserModule,
} from './features';

@Module({
	imports: [
		// TypeORM Module
		TypeOrmModule.forRoot(DatabaseConfig),
		StorageModule,
		// JWT Module for middleware
		JwtModule.register({
			secret: AppConfig.jwt.secret,
			signOptions: { expiresIn: AUTH_CONSTANTS.JWT_EXPIRATION },
		}),
		// Feature Modules - Direct imports instead of TriviaModule
		AuthModule,
		GameModule,
		MultiplayerModule,
		AnalyticsModule,
		AdminModule,
		CacheModule,
		UserModule,
		PaymentModule,
		CreditsModule,
	],
	controllers: [AppController, MetricsController, HealthController],
	exports: [],
	providers: [
		// Global exception filter for better error logging
		{
			provide: APP_FILTER,
			useClass: GlobalExceptionFilter,
		},
		// Global cache interceptor for @Cache decorator
		{
			provide: APP_INTERCEPTOR,
			useFactory: (cacheService: CacheService, reflector: Reflector) => {
				return new CacheInterceptor(cacheService, reflector);
			},
			inject: [CacheService, Reflector],
		},
		// Global response formatting interceptor
		{
			provide: APP_INTERCEPTOR,
			useClass: ResponseFormatter,
		},
		// Global performance monitoring interceptor
		{
			provide: APP_INTERCEPTOR,
			useClass: PerformanceInterceptor,
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

		// Apply rate limiting middleware
		consumer.apply(RateLimitMiddleware).forRoutes('*');
	}
}
