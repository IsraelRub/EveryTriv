import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { AppController } from "./app.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppConfig } from "./config/app.config";
import { TriviaModule } from "./features/trivia/trivia.module";
import { UserModule } from "./features/user/user.module";
import { AuthModule } from "./features/auth/auth.module";
import { RateLimitMiddleware } from "./shared/middleware/rate-limit.middleware";
import { LoggerModule } from "./shared/modules/logger/logger.module";
import { AIModule } from "./shared/services/ai/ai.module";

@Module({
  imports: [
    TypeOrmModule.forRoot(AppConfig.typeOrmConfig),
    LoggerModule,
    AIModule,
    TriviaModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes("*");
  }
}
