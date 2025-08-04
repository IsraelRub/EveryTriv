import winston from 'winston';
import path from 'path';

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, meta }) => {
        return `[${timestamp}] [${level.toUpperCase()}] ${message} ${meta ? JSON.stringify(meta) : ''}`;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        // Write to server.log file
        new winston.transports.File({
            filename: path.join(process.cwd(), 'logs', 'server.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Also log to console in development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            ),
        }),
    ],
});

// Log HTTP requests middleware
export const logRequest = (req: any, res: any, next: any): void => {
    const startTime = Date.now();

    // Once the request is processed
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info(`${req.method} ${req.originalUrl}`, {
            meta: {
                method: req.method,
                url: req.originalUrl,
                route: req.route?.path || 'unknown',
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                ip: req.ip,
                userAgent: req.get('user-agent'),
                requestBody: req.method !== 'GET' ? req.body : undefined
            }
        });
    });

    next();
};

// Export logger methods
export const log = {
    error: (message: string, meta?: any) => logger.error(message, { meta }),
    warn: (message: string, meta?: any) => logger.warn(message, { meta }),
    info: (message: string, meta?: any) => logger.info(message, { meta }),
    debug: (message: string, meta?: any) => logger.debug(message, { meta }),
};

export default logger;