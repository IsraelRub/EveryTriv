/**
 * Domain Types Index
 *
 * @module DomainTypes
 * @description Central export point for all domain-specific type definitions
 * @used_by shared/types/index.ts, client/src/types, server/src/features
 */

/**
 * AI Domain Types
 * @description AI-related type definitions including providers, models, and responses
 */
export * from './ai';

/**
 * Analytics Domain Types
 * @description Analytics-related type definitions including metrics and analytics data
 */
export * from './analytics';

/**
 * Game Domain Types
 * @description Game-related type definitions including trivia, sessions, and configuration
 */
export * from './game';

/**
 * User Domain Types
 * @description User-related type definitions including profiles, preferences, and addresses
 */
export * from './user';

/**
 * Payment Domain Types
 * @description Payment-related type definitions including payment data and results
 */
export * from './payment.types';

/**
 * Credits Domain Types
 * @description Credits-related type definitions including balances, transactions, and purchase requests
 */
export * from './credits.types';

/**
 * Validation Domain Types
 * @description Validation-related type definitions including forms, rules, and validation results
 */
export * from './validation.types';
