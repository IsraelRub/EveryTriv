/**
 * Server Validation Types
 *
 * @module ServerValidationTypes
 * @description Server-specific validation type definitions
 */
import type { ValidationContext as SharedValidationContext } from 'everytriv-shared/types';

// Re-export ValidationOptions from shared instead of duplicating
export type { ValidationOptions } from 'everytriv-shared/types';

// Re-export ValidationResult from shared instead of duplicating
export type { ValidationResult } from 'everytriv-shared/types';

/**
 * Validation service options with index signature for logging compatibility
 */
export interface ValidationServiceOptions extends Record<string, unknown> {
	/** Whether to sanitize input */
	sanitize?: boolean;
	/** Validation context */
	context?: SharedValidationContext;
	/** Custom error messages */
	customMessages?: Record<string, string>;
	/** Whether to log validation failures */
	logFailures?: boolean;
	/** Additional properties for logging compatibility */
}

// Re-export ValidationError from shared instead of duplicating
export type { ValidationError } from 'everytriv-shared/types';

// Re-export ValidationContext from shared instead of duplicating
export type { ValidationContext } from 'everytriv-shared/types';

// Re-export ValidationRule from shared instead of duplicating
export type { ValidationRule } from 'everytriv-shared/types';

// Re-export ValidationMiddlewareConfig from shared instead of duplicating
export type { ValidationMiddlewareConfig as ValidationConfig } from 'everytriv-shared/types';
