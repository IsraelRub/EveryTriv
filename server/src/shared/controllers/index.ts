/**
 * Shared Controllers Index
 *
 * @module SharedControllers
 * @description Central export point for all shared controllers
 */

export * from './client-logs.controller';

// Re-export ServerLogger as LoggerService for backward compatibility
export { ServerLogger as LoggerService } from 'everytriv-shared/services/logging/serverLogger.service';
