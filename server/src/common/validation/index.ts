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
export * from './validation.service';

/**
 * Custom decorators
 * @description Custom decorators for enhanced controller functionality
 * @used_by server/src/features, server/src/controllers
 */
export * from '../decorators/validation.decorator';

/**
 * Validation module
 * @description Validation module configuration
 * @used_by server/src/app, server/src/features
 */
export * from './validation.module';

/**
 * LanguageTool Service
 * @description LanguageTool service for server-side validation
 * @used_by server/src/features, server/src/controllers
 */
export * from './languageTool.service';
