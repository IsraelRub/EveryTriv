/**
 * Export all shared resources for easier imports
 * Note: We're only exporting the modules and not individual types/entities 
 * to avoid naming conflicts
 */
export { LoggerModule, LoggerService } from './modules';
export { AIModule, AIService } from './services';

// Export utility functions
export * from './utils';

// Export middleware
export * from './middleware';

// Export repositories
export * from './repositories';
