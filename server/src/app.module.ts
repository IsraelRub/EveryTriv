import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, Reflector } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppConfig } from '@config';
import { GlobalExceptionFilter } from '@common/globalException.filter';
import { LocalAuthGuard, RolesGuard, UserStatusGuard } from '@common/guards';
import { CacheInterceptor, PerformanceInterceptor, ResponseFormatter } from '@common/interceptors';
import { createAppValidationPipe } from '@common/pipes';
import { HealthController, MetricsController } from '@internal/controllers';
import { UserEntity } from '@internal/entities';
import { RateLimitMiddleware } from '@internal/middleware';
import { CacheModule, CacheService, StorageModule } from '@internal/modules';

import { AppController } from './app.controller';
import {
	AdminModule,
	AnalyticsModule,
	AuthModule,
	CreditsModule,
	GameModule,
	MaintenanceModule,
	MultiplayerModule,
	PaymentModule,
	UserModule,
} from './features';
import { SystemAnalyticsService } from './features/analytics/services';

@Module({
	imports: [
		// TypeORM Module
		TypeOrmModule.forRoot({
			...AppConfig.createTypeOrmDataSourceOptions(),
			autoLoadEntities: true,
		}),
		TypeOrmModule.forFeature([UserEntity]),
		StorageModule,
		// JWT Module for middleware
		JwtModule.register({
			secret: AppConfig.jwt.secret,
			signOptions: { expiresIn: AppConfig.jwt.expiresIn },
		}),
		// Feature Modules - Direct imports instead of TriviaModule
		AuthModule,
		GameModule,
		MultiplayerModule,
		AnalyticsModule,
		AdminModule,
		MaintenanceModule, // For schedulers and maintenance operations
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
			useFactory: (systemAnalyticsService: SystemAnalyticsService) => {
				return new PerformanceInterceptor(systemAnalyticsService);
			},
			inject: [SystemAnalyticsService],
		},
		// Global authentication guard
		{
			provide: APP_GUARD,
			useClass: LocalAuthGuard,
		},
		// Global roles guard
		{
			provide: APP_GUARD,
			useClass: RolesGuard,
		},
		{
			provide: APP_GUARD,
			useClass: UserStatusGuard,
		},
		// Global validation pipe for DTO validation
		{
			provide: APP_PIPE,
			useValue: createAppValidationPipe(),
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
