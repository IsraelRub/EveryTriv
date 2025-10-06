/**
 * Validation Decorators
 *
 * @module ValidationDecorators
 * @description Decorators for request validation and rate limiting
 * @author EveryTriv Team
 */
import { SetMetadata } from '@nestjs/common';

import type { ApiResponseConfig, RateLimitConfig } from '../../internal/types';

/**
 * Set rate limit for endpoint
 * @param limit Maximum number of requests
 * @param window Time window in seconds
 * @returns Method decorator that sets rate limit
 */
export const RateLimit = (limit: number, window: number) => SetMetadata('rateLimit', { limit, window });

/**
 * Set advanced rate limiting configuration
 * @param config Rate limiting configuration object
 * @returns Method decorator that sets advanced rate limiting
 */
export const RateLimitAdvanced = (config: RateLimitConfig) => SetMetadata('rateLimit', config);

/**
 * Set API response documentation
 * @param status HTTP status code
 * @param description Response description
 * @param example Example response
 * @returns Method decorator that sets API response documentation
 */
export const ApiResponse = (status: number, description: string, example?: unknown) =>
	SetMetadata('apiResponse', { status, description, example });

/**
 * Set multiple API response documentation
 * @param responses Array of response configurations
 * @returns Method decorator that sets multiple API responses
 */
export const ApiResponses = (responses: ApiResponseConfig[]) => SetMetadata('apiResponses', responses);

/**
 * Set request validation schema
 * @param schema Validation schema name or object
 * @returns Method decorator that sets validation schema
 */
export const ValidateSchema = (schema: string | object) => SetMetadata('validationSchema', schema);

/**
 * Set custom validation rules
 * @param rules Custom validation rules
 * @returns Method decorator that sets custom validation
 */
export const CustomValidation = (rules: Record<string, unknown>) => SetMetadata('customValidation', rules);

/**
 * Set validation with custom error messages
 * @param rules Validation rules
 * @param errorMessages Custom error messages
 * @returns Method decorator that sets validation with custom errors
 */
export const ValidationWithErrors = (rules: Record<string, unknown>, errorMessages: Record<string, string>) =>
	SetMetadata('validationWithErrors', { rules, errorMessages });

/**
 * Set async validation
 * @param validator Async validation function
 * @returns Method decorator that sets async validation
 */
export const AsyncValidation = (validator: (data: Record<string, unknown>) => Promise<boolean>) =>
	SetMetadata('asyncValidation', validator);

/**
 * Set validation with transformation
 * @param rules Validation rules
 * @param transformer Data transformation function
 * @returns Method decorator that sets validation with transformation
 */
export const ValidationWithTransform = (
	rules: Record<string, unknown>,
	transformer: (data: Record<string, unknown>) => Record<string, unknown>
) => SetMetadata('validationWithTransform', { rules, transformer });

/**
 * Set conditional validation
 * @param condition Condition function
 * @param rules Validation rules to apply when condition is true
 * @returns Method decorator that sets conditional validation
 */
export const ConditionalValidation = (
	condition: (data: Record<string, unknown>) => boolean,
	rules: Record<string, unknown>
) => SetMetadata('conditionalValidation', { condition, rules });

/**
 * Set validation with sanitization
 * @param rules Validation rules
 * @param sanitizer Sanitization function
 * @returns Method decorator that sets validation with sanitization
 */
export const ValidationWithSanitization = (
	rules: Record<string, unknown>,
	sanitizer: (data: Record<string, unknown>) => Record<string, unknown>
) => SetMetadata('validationWithSanitization', { rules, sanitizer });
