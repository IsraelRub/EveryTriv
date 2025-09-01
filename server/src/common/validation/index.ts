/**
 * Common Validation Index
 *
 * @module CommonValidation
 * @description Central export point for all validation utilities and middleware
 * @used_by server/features, server/middleware, server/controllers
 */

/**
 * Validation service
 * @description Core validation logic and utilities
 * @used_by server/features, server/controllers
 */
export * from './validation.service';

/**
 * Validation decorator
 * @description Custom validation decorators
 * @used_by server/features, server/controllers
 */
export * from './validation.decorator';

/**
 * Validation module
 * @description Validation module configuration
 * @used_by server/app, server/features
 */
export * from './validation.module';

/**
 * LanguageTool Service
 * @description LanguageTool service for server-side validation
 * @used_by server/features, server/controllers
 */
export * from './languageTool.service';
