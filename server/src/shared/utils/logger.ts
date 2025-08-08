import * as winston from "winston";
import * as path from "path";

// File format with emojis but no color codes - for log files
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, meta }) => {
    const emoji =
      {
        error: "❌",
        warn: "⚠️",
        info: "📝",
        debug: "🐛",
      }[level] || "📝";

    return `[${timestamp}] [${level.toUpperCase()}] ${emoji} ${message}${meta ? ` ${JSON.stringify(meta)}` : ""}`;
  })
);

// Create logger that only writes to files - let NestJS handle console
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "prod" ? "info" : "debug",
  transports: [
    // File logging only - with emojis but no color codes
    new winston.transports.File({
      filename: path.join(process.cwd(), "logs", "server.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: fileFormat,
    }),
    // No console transport - let NestJS handle console output
  ],
});

// Simple HTTP request logging
export const logRequest = (req: any, res: any, next: any): void => {
  const startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusEmoji =
      res.statusCode >= 400 ? "🔴" : res.statusCode >= 300 ? "🟡" : "🟢";

    logger.info(
      `${statusEmoji} ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`,
      {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
        userAgent: req.get("user-agent")?.substring(0, 100),
      }
    );
  });

  next();
};

// Simple logging methods
export const log = {
  error: (message: string, meta?: any) => {
    logger.error(message, meta);
  },
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
  },
  info: (message: string, meta?: any) => {
    logger.info(message, meta);
  },
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
  },

  // NestJS specific - log errors with context
  nestError: (context: string, message: string, error?: any) => {
    logger.error(`[${context}] ${message}`, { 
      context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error
    });
  },

  // HTTP exceptions
  httpError: (method: string, url: string, statusCode: number, message: string, error?: any) => {
    const statusEmoji = statusCode >= 500 ? "💥" : "🔴";
    logger.error(`${statusEmoji} HTTP ${statusCode} ${method} ${url}: ${message}`, {
      method,
      url,
      statusCode,
      message,
      error: error instanceof Error ? error.message : error,
    });
  },

  // Additional specialized methods for compatibility
  auth: (message: string, meta?: any) => {
    logger.info(`🔐 Auth: ${message}`, meta);
  },

  validationError: (field: string, value: any, constraint: string, meta?: any) => {
    logger.warn(`🔍 Validation failed for ${field}: ${constraint}`, {
      field,
      value: typeof value === 'object' ? JSON.stringify(value) : value,
      constraint,
      ...meta
    });
  },
};

export default logger;
