import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { Redis } from "ioredis";

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private redis: Redis;
  private readonly WINDOW_SIZE_IN_SECONDS = 60;
  private readonly MAX_REQUESTS_PER_WINDOW = 100;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip;
    const key = `ratelimit:${ip}`;

    try {
      const requests = await this.redis.incr(key);

      if (requests === 1) {
        await this.redis.expire(key, this.WINDOW_SIZE_IN_SECONDS);
      }

      if (requests > this.MAX_REQUESTS_PER_WINDOW) {
        throw new HttpException(
          {
            status: HttpStatus.TOO_MANY_REQUESTS,
            message: "Too many requests, please try again later.",
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      // Add headers
      res.header("X-RateLimit-Limit", this.MAX_REQUESTS_PER_WINDOW.toString());
      res.header(
        "X-RateLimit-Remaining",
        (this.MAX_REQUESTS_PER_WINDOW - requests).toString()
      );

      next();
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      next(err);
    }
  }
}
