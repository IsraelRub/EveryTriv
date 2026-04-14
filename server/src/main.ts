// prettier-ignore
import 'tsconfig-paths/register';

import './loadEnv';

import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json, urlencoded } from "express";

import {
  HttpMethod,
  LOCALHOST_CLIENT_ORIGINS,
  LOCALHOST_CONFIG,
  MESSAGE_FORMATTERS,
  TIME_PERIODS_MS,
} from "@shared/constants";
import { AUTH_CONSTANTS } from "@internal/constants";
import { calculateDuration, getErrorMessage, getErrorStack, isNonEmptyString } from "@shared/utils";

import { AppModule } from "./app.module";
import { AppConfig, validateEnvironmentVariables } from "@config";
import dataSource from "./config/dataSource";
import { RedisIoAdapter } from "@internal/modules";

async function bootstrap() {
  const startTime = Date.now();

  try {
    // Validate environment variables before starting the application
    validateEnvironmentVariables();

    console.log(MESSAGE_FORMATTERS.system.startup());

    // Run pending migrations before Nest creates modules (so AdminBootstrap finds tables)
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    const pendingMigrations = await dataSource.showMigrations();
    if (pendingMigrations) {
      console.log("Running pending database migrations...");
      await dataSource.runMigrations();
      console.log("Migrations completed.");
    }
    await dataSource.destroy();
    console.log(MESSAGE_FORMATTERS.system.config(), {
      DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD,
      DATABASE_HOST: process.env.DATABASE_HOST,
      REDIS_HOST: process.env.REDIS_HOST,
    });

    // Check Google OAuth configuration
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    const googleClientIdValue = googleClientId?.trim().toLowerCase() ?? "";
    const googleClientSecretValue = googleClientSecret?.trim().toLowerCase() ?? "";
    const hasGooglePlaceholderValue =
      googleClientIdValue === "your-google-client-id.apps.googleusercontent.com" ||
      googleClientIdValue === "your-google-client-id-here" ||
      googleClientIdValue.includes("your-google-client-id") ||
      googleClientSecretValue === "gocspx-your-google-client-secret" ||
      googleClientSecretValue === "your-google-client-secret-here" ||
      googleClientSecretValue.includes("your-google-client-secret");

    if (!googleClientId || !googleClientSecret || hasGooglePlaceholderValue) {
      console.warn(MESSAGE_FORMATTERS.oauth.credentialsMissing("GoogleOAuth"));
      console.warn(
        MESSAGE_FORMATTERS.oauth.warn(
          "GoogleOAuth",
          "Google OAuth authentication will be disabled.",
        ),
      );
      console.warn(
        MESSAGE_FORMATTERS.oauth.warn(
          "GoogleOAuth",
          "Please set valid GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables.",
        ),
      );
    } else {
      console.log(MESSAGE_FORMATTERS.oauth.credentialsValid("GoogleOAuth"));
    }

    // Check CLIENT_URL for OAuth redirect
    const clientUrl = process.env.CLIENT_URL;
    if (!isNonEmptyString(clientUrl)) {
      console.warn(
        MESSAGE_FORMATTERS.oauth.warn(
          "GoogleOAuth",
          "CLIENT_URL is not set. OAuth redirect will use localhost fallback. Set CLIENT_URL for production.",
        ),
      );
    } else if (AppConfig.isProductionRuntime && /localhost|127\.0\.0\.1/i.test(clientUrl)) {
      console.warn(
        MESSAGE_FORMATTERS.oauth.warn(
          "GoogleOAuth",
          "CLIENT_URL appears to be localhost in production. OAuth redirect may not work for users.",
        ),
      );
    }

    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      bufferLogs: false,
      logger: ["error", "warn", "log"],
    });
    console.log(MESSAGE_FORMATTERS.nestjs.appCreated());

    // Initialize Redis Adapter
    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);

    const corsOrigins = [
      ...new Set([
        process.env.CLIENT_URL ?? LOCALHOST_CONFIG.urls.CLIENT,
        ...LOCALHOST_CLIENT_ORIGINS,
      ]),
    ];

    app.enableCors({
      origin: corsOrigins,
      credentials: true,
      methods: Object.values(HttpMethod),
      allowedHeaders: [
        "Content-Type",
        AUTH_CONSTANTS.AUTH_HEADER,
        "X-Requested-With",
      ],
    });

    // Enable JSON body parser - must be before other middleware
    app.use(json({ limit: "10mb" }));
    app.use(
      urlencoded({
        extended: true,
        limit: "10mb",
        type: "application/x-www-form-urlencoded",
      }),
    );

    app.use(require("cookie-parser")());

    // Session for OAuth state (CSRF protection)
    const session = require("express-session");
    app.use(
      session({
        secret: process.env.SESSION_SECRET ?? "everytriv-oauth-session-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.COOKIE_SECURE !== "false",
          sameSite: "lax",
          maxAge: TIME_PERIODS_MS.TEN_MINUTES,
        },
      }),
    );

    // Swagger API Documentation
    const config = new DocumentBuilder()
      .setTitle("EveryTriv API")
      .setDescription("API documentation for EveryTriv trivia game platform")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "JWT",
          description: "Enter JWT token",
          in: "header",
        },
        "JWT-auth",
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);

    await app.listen(AppConfig.port);

    console.log("Server startup complete:", {
      port: AppConfig.port,
      bootTime: `${calculateDuration(startTime)}ms`,
      environment: AppConfig.nodeEnv,
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    try {
      // Use console.error for bootstrap errors since logger might not be available
      console.error("Failed to start server:", {
        error: getErrorMessage(error),
        stack: getErrorStack(error),
        bootAttemptDuration: `${calculateDuration(startTime)}ms`,
      });
    } catch (shutdownError) {
      console.error("Shutdown: Failed to start server", {
        originalError: getErrorMessage(error),
        shutdownError: getErrorMessage(shutdownError),
      });
    }
    process.exit(1);
  }
}

bootstrap();
