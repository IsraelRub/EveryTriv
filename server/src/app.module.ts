import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { AppController } from "./app.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppConfig } from "./config/app.config";
import { TriviaModule, UserModule, AuthModule } from "./features";
import { GameHistoryModule } from "./features/game-history";
import { 
  RateLimitMiddleware, 
  RoleCheckMiddleware,
  CountryCheckMiddleware, 
  AuthMiddleware,
  BodyValidationMiddleware
} from "./shared/middleware";
import { LoggerModule, AIModule } from "./shared";
import { ClientLogsController } from "./shared/controllers/client-logs.controller";
import { GlobalExceptionFilter } from "./config/global-exception.filter";
import { logRequest } from "./shared/utils/logger";
import { RedisModule } from "./config/redis.module";

@Module({
  imports: [
    // Redis Module - Always import first for middleware dependencies
    RedisModule,
    // Only load TypeORM if SKIP_DB is not set
    ...(process.env.SKIP_DB === 'true' ? [] : [TypeOrmModule.forRoot(AppConfig.typeOrmConfig)]),
    LoggerModule,
    AIModule,
    // Skip modules that depend on TypeORM when SKIP_DB is true
    ...(process.env.SKIP_DB === 'true' ? [] : [
      TriviaModule,
      UserModule,
      AuthModule,
      GameHistoryModule,
    ]),
  ],
  controllers: [AppController, ClientLogsController],
  providers: [
    // Global exception filter for better error logging
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply middleware in the order specified in the architecture diagram
    
    // Apply rate limiting middleware first
    consumer.apply(RateLimitMiddleware).forRoutes("*");
    
    // Apply simple request logging
    consumer.apply(logRequest).forRoutes("*");
    
    // Apply role check middleware - checks if admin, user, or no body as per diagram
    consumer.apply(RoleCheckMiddleware).forRoutes("*");
    
    // Apply country check middleware as per diagram
    consumer.apply(CountryCheckMiddleware).forRoutes("*");
    
    // Apply auth middleware - checks if user is logged in as per diagram
    consumer.apply(AuthMiddleware).forRoutes("*");
    
    // Apply body validation middleware - checks if request body is valid as per diagram
    consumer.apply(BodyValidationMiddleware).forRoutes("*");
  }
}
