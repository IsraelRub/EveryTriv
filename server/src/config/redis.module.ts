import { Module } from "@nestjs/common";
import { Global } from "@nestjs/common";
import Redis from "ioredis";
import { redisConfig } from "./redis.config";
import { RedisService } from "./redis.service";
import { LoggerModule } from "../shared/modules/logger/logger.module";

@Global()
@Module({
  imports: [LoggerModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const redisClient = new Redis(redisConfig);
        return redisClient;
      },
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
