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
 * @example
 * ```typescript
 * @Post('login')
 * @RateLimit(5, 60) // 5 requests per minute
 * async login(@Body() loginDto: LoginDto) {
 *   // Login logic
 * }
 * ```
 */
export const RateLimit = (limit: number, window: number) => SetMetadata('rateLimit', { limit, window });

/**
 * Set advanced rate limiting configuration
 * @param config Rate limiting configuration object
 * @returns Method decorator that sets advanced rate limiting
 * @example
 * ```typescript
 * @Post('api-call')
 * @RateLimitAdvanced({
 *   limit: 100,
 *   window: 3600,
 *   keyGenerator: (req) => req.user?.id,
 *   skipSuccessfulRequests: true
 * })
 * async makeApiCall() {
 *   // API call logic
 * }
 * ```
 */
export const RateLimitAdvanced = (config: RateLimitConfig) => SetMetadata('rateLimit', config);

/**
 * Set API response documentation
 * @param status HTTP status code
 * @param description Response description
 * @param example Example response
 * @returns Method decorator that sets API response documentation
 * @example
 * ```typescript
 * @Get('profile')
 * @ApiResponse(200, 'User profile retrieved successfully', { id: '123', username: 'user' })
 * async getProfile(@CurrentUser() user: UserPayload) {
 *   // Profile logic
 * }
 * ```
 */
export const ApiResponse = (status: number, description: string, example?: unknown) =>
	SetMetadata('apiResponse', { status, description, example });

/**
 * Set multiple API response documentation
 * @param responses Array of response configurations
 * @returns Method decorator that sets multiple API responses
 * @example
 * ```typescript
 * @Get('data')
 * @ApiResponses([
 *   { status: 200, description: 'Success', example: { data: [] } },
 *   { status: 404, description: 'Not found', example: { error: 'Not found' } }
 * ])
 * async getData() {
 *   // Data logic
 * }
 * ```
 */
export const ApiResponses = (responses: ApiResponseConfig[]) => SetMetadata('apiResponses', responses);

/**
 * Set request validation schema
 * @param schema Validation schema name or object
 * @returns Method decorator that sets validation schema
 * @example
 * ```typescript
 * @Post('user')
 * @ValidateSchema('userCreateSchema')
 * async createUser(@Body() userData: unknown) {
 *   // User creation logic
 * }
 * ```
 */
export const ValidateSchema = (schema: string | object) => SetMetadata('validationSchema', schema);

/**
 * Set custom validation rules
 * @param rules Custom validation rules
 * @returns Method decorator that sets custom validation
 * @example
 * ```typescript
 * @Post('custom')
 * @CustomValidation({
 *   body: { required: ['name', 'email'] },
 *   query: { allowed: ['page', 'limit'] }
 * })
 * async customEndpoint(@Body() data: unknown) {
 *   // Custom logic
 * }
 * ```
 */
export const CustomValidation = (rules: Record<string, unknown>) => SetMetadata('customValidation', rules);

/**
 * Set validation with custom error messages
 * @param rules Validation rules
 * @param errorMessages Custom error messages
 * @returns Method decorator that sets validation with custom errors
 * @example
 * ```typescript
 * @Post('user')
 * @ValidationWithErrors(
 *   { body: { required: ['name', 'email'] } },
 *   { 'name.required': 'Name is mandatory', 'email.required': 'Email is mandatory' }
 * )
 * async createUser(@Body() data: unknown) {
 *   // User creation logic
 * }
 * ```
 */
export const ValidationWithErrors = (rules: Record<string, unknown>, errorMessages: Record<string, string>) =>
	SetMetadata('validationWithErrors', { rules, errorMessages });

/**
 * Set async validation
 * @param validator Async validation function
 * @returns Method decorator that sets async validation
 * @example
 * ```typescript
 * @Post('unique-email')
 * @AsyncValidation(async (data) => {
 *   const exists = await userService.emailExists(data.email);
 *   return !exists;
 * })
 * async createUser(@Body() data: unknown) {
 *   // User creation logic
 * }
 * ```
 */
export const AsyncValidation = (validator: (data: Record<string, unknown>) => Promise<boolean>) =>
	SetMetadata('asyncValidation', validator);

/**
 * Set validation with transformation
 * @param rules Validation rules
 * @param transformer Data transformation function
 * @returns Method decorator that sets validation with transformation
 * @example
 * ```typescript
 * @Post('data')
 * @ValidationWithTransform(
 *   { body: { required: ['name'] } },
 *   (data) => ({ ...data, name: data.name.trim().toLowerCase() })
 * )
 * async processData(@Body() data: unknown) {
 *   // Data processing logic
 * }
 * ```
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
 * @example
 * ```typescript
 * @Post('conditional')
 * @ConditionalValidation(
 *   (data) => data.type === 'premium',
 *   { body: { required: ['premiumField'] } }
 * )
 * async conditionalEndpoint(@Body() data: unknown) {
 *   // Conditional logic
 * }
 * ```
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
 * @example
 * ```typescript
 * @Post('sanitized')
 * @ValidationWithSanitization(
 *   { body: { required: ['content'] } },
 *   (data) => sanitizeHtml(data.content)
 * )
 * async createContent(@Body() data: unknown) {
 *   // Content creation logic
 * }
 * ```
 */
export const ValidationWithSanitization = (
	rules: Record<string, unknown>,
	sanitizer: (data: Record<string, unknown>) => Record<string, unknown>
) => SetMetadata('validationWithSanitization', { rules, sanitizer });
