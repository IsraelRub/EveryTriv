/**
 * Common Validation Index
 *
 * @module CommonValidation
 * @description Central export point for all validation utilities and middleware
 * @used_by server/src/features, server/middleware, server/src/controllers
 */

/**
 * Validation service
 * @description Core validation logic and utilities
 * @used_by server/src/features, server/src/controllers
 */
export * from './languageTool.service';
/**
 * Validation service
 * @description Core validation logic and utilities
 * @used_by server/src/features, server/src/controllers
 */
export * from './validation.service';

/**
 * Validation module
 * @description Validation module configuration
 * @used_by server/src/app, server/src/features
 */
export * from './validation.module';
