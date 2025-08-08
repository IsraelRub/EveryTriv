import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AppConfig } from "./config/app.config";
import * as dotenv from "dotenv";
import { NestExpressApplication } from "@nestjs/platform-express";
import logger from "./shared/utils/logger";
import { LoggerService } from "./shared/modules/logger/logger.service";

dotenv.config({
  path: process.env.NODE_ENV === "prod" ? ".env.prod" : ".env",
});

async function bootstrap() {
  const startTime = Date.now();
  try {
    // Create NestJS application
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      bufferLogs: true,
    });
    
    // Get LoggerService instance from the app
    const loggerService = app.get(LoggerService);
    
    // Set up logger
    app.useLogger(loggerService);
    
    // Enable CORS
    app.enableCors();
    
    // Start server
    await app.listen(AppConfig.port);
    
    const bootDuration = Date.now() - startTime;
    loggerService.logStartup(`Server running on port ${AppConfig.port}`, { 
      bootTime: `${bootDuration}ms`,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    });
    
    loggerService.logPerformance('server.bootstrap', bootDuration, {
      port: AppConfig.port,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Failed to start server', { 
      error, 
      bootAttemptDuration: `${Date.now() - startTime}ms` 
    });
    process.exit(1);
  }
}

bootstrap();
