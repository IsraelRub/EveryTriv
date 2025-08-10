import * as winston from "winston";
import * as path from "path";
import * as fs from "fs";
import { 
  formatLogEntry, 
  formatHttpRequestMessage, 
  formatHttpErrorMessage,
  formatAuthMessage,
  formatValidationMessage
} from "../../../../shared/utils/logging.utils";

// Clear logs on startup
function clearLogsOnStartup() {
  try {
    const serverLogPath = path.join(process.cwd(), "logs", "server.log");
    const clientLogPath = path.join(process.cwd(), "..", "client", "logs", "client.log");
    
    // Clear server logs
    if (fs.existsSync(serverLogPath)) {
      fs.writeFileSync(serverLogPath, '', 'utf8');
    }
    
    // Clear client logs  
    if (fs.existsSync(clientLogPath)) {
      fs.writeFileSync(clientLogPath, '', 'utf8');
    }
    
    // Ensure log directories exist
    const serverLogDir = path.dirname(serverLogPath);
    const clientLogDir = path.dirname(clientLogPath);
    
    if (!fs.existsSync(serverLogDir)) {
      fs.mkdirSync(serverLogDir, { recursive: true });
    }
    
    if (!fs.existsSync(clientLogDir)) {
      fs.mkdirSync(clientLogDir, { recursive: true });
    }
    
  } catch (error) {
    console.warn('Failed to clear logs on startup:', error);
  }
}

// Clear logs immediately when this module is loaded
clearLogsOnStartup();

// File format with emojis but no color codes - for log files
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, meta }) => {
    return formatLogEntry(timestamp as string, level as string, message as string, meta);
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
    const message = formatHttpRequestMessage(req.method, req.originalUrl, res.statusCode, duration);

    logger.info(message, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get("user-agent")?.substring(0, 100),
    });
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
    const errorMessage = formatHttpErrorMessage(method, url, statusCode, message);
    logger.error(errorMessage, {
      method,
      url,
      statusCode,
      message,
      error: error instanceof Error ? error.message : error,
    });
  },

  // Additional specialized methods for compatibility
  auth: (message: string, meta?: any) => {
    logger.info(formatAuthMessage(message), meta);
  },

  validationError: (field: string, value: any, constraint: string, meta?: any) => {
    logger.warn(formatValidationMessage(field, constraint), {
      field,
      value: typeof value === 'object' ? JSON.stringify(value) : value,
      constraint,
      ...meta
    });
  },
};

export default logger;
