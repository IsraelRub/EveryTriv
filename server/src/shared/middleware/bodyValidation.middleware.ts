import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';

import { LoggerService } from '../controllers';
import type { ValidationConfig } from '../types';
import { NestNextFunction, NestRequest, NestResponse } from '../types';

/**
 * Enhanced middleware that performs comprehensive validation on request body
 * Supports both basic body validation and field-specific validation
 */
@Injectable()
export class BodyValidationMiddleware implements NestMiddleware {
	constructor(
		private readonly logger: LoggerService,
		private validationConfig?: ValidationConfig
	) {}

	use(req: NestRequest, _res: NestResponse, next: NestNextFunction) {
		// Skip validation for GET requests and similar
		if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
			next();
			return;
		}

		try {
			// Basic body validation
			this.validateBasicBody(req);

			// Field-specific validation if config provided
			if (this.validationConfig?.body) {
				this.validateFields(req);
			}

			// Log successful validation
			this.logger.validationDebug('body', 'valid', 'Request body validation passed', {
				path: req.path,
				method: req.method,
				contentType: req.headers['content-type'],
			});

			next();
		} catch (error) {
			if (error instanceof BadRequestException) {
				throw error;
			}

			this.logger.validationError('body', 'invalid', 'Body validation middleware error', {
				error: error instanceof Error ? error.message : 'Unknown error',
				path: req.path,
				method: req.method,
			});

			throw new BadRequestException('Invalid request body');
		}
	}

	private validateBasicBody(req: NestRequest): void {
		// Check if body exists for methods that should have one
		if (!req.body || Object.keys(req.body).length === 0) {
			this.logger.validationWarn('body', 'empty', 'Empty request body', {
				path: req.path,
				method: req.method,
			});
			throw new BadRequestException('Request body is required');
		}

		// Basic validation - ensure body is valid JSON object
		if (typeof req.body !== 'object' || req.body === null) {
			this.logger.validationWarn('body', 'invalid', 'Invalid request body format', {
				path: req.path,
				method: req.method,
				bodyType: typeof req.body,
			});
			throw new BadRequestException('Invalid request body format');
		}
	}

	private async validateFields(req: NestRequest): Promise<void> {
		if (!this.validationConfig?.body) return;

		const errors: Array<{
			field: string;
			message: string;
			value?: unknown;
		}> = [];

		for (const rule of this.validationConfig.body) {
			const value = req.body[rule.field];

			if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
				errors.push({
					field: rule.field,
					message: rule.errorMessage || `${rule.field} is required`,
					value,
				});

				if (this.validationConfig.stopOnFirstError) break;
				continue;
			}

			if (value) {
				try {
					const result = await rule.validator(value);
					if (!result.isValid) {
						errors.push({
							field: rule.field,
							message: result.errors[0] || rule.errorMessage || `${rule.field} is invalid`,
							value,
						});

						if (this.validationConfig.stopOnFirstError) break;
					}
				} catch (error) {
					errors.push({
						field: rule.field,
						message: error instanceof Error ? error.message : `${rule.field} validation failed`,
						value,
					});

					if (this.validationConfig.stopOnFirstError) break;
				}
			}
		}

		if (errors.length > 0) {
			throw new BadRequestException({
				message: 'Validation failed',
				errors,
				timestamp: new Date().toISOString(),
			});
		}
	}
}

/**
 * Factory function to create body validation middleware with custom validation config
 */
