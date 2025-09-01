/**
 * Validation module exports
 *
 * @module Validation
 * @description Shared validation utilities and schemas for EveryTriv
 * @version 1.0.0
 * @author EveryTriv Team
 */

/**
 * Core validation utilities
 * @description Main validation functions for various data types and inputs
 * @exports {Function} Core validation utility functions
 */
export * from './validation.utils';

/**
 * Difficulty validation
 * @description Custom difficulty validation and processing functions
 * @exports {Function} Difficulty validation utility functions
 */
export * from './difficulty.validation';

/**
 * Trivia validation
 * @description Trivia game content and rules validation functions
 * @exports {Function} Trivia validation utility functions
 */
export * from './trivia.validation';

/**
 * Payment validation
 * @description Payment processing and transaction validation functions
 * @exports {Function} Payment validation utility functions
 */
export * from './payment.validation';

/**
 * JSON Schemas
 * @description Validation schema definitions and schema utilities
 * @exports {Object} Validation schema definitions
 */
export * from './schemas';
