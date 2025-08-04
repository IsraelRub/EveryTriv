import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AppConfig } from "./config/app.config";
import * as dotenv from "dotenv";
import { NestExpressApplication } from "@nestjs/platform-express";
import { logRequest } from "./shared/utils/logger";
import logger from "./shared/utils/logger";

dotenv.config({
  path: process.env.NODE_ENV === "prod" ? ".env.prod" : ".env",
});

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    
    // Enable CORS
    app.enableCors();
    
    // Add request logging middleware
    app.use(logRequest);
    
    // Start server
    await app.listen(AppConfig.port);
    logger.info(`Server running on port ${AppConfig.port}`);
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

bootstrap();
