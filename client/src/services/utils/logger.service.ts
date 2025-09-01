/**
 * Client Logger Service
 *
 * @module ClientLogger
 * @description Client-side logging service using shared modular architecture
 * @used_by client/services, client/components, client/hooks
 */
import { ClientLogger, clientLogger, createClientLogger } from 'everytriv-shared/services';

// Re-export the client logger for use in the client
export { ClientLogger, clientLogger, createClientLogger };

// Export the logger instance as the default
export default clientLogger;

// Legacy export for backward compatibility
export const loggerService = clientLogger;
