/**
 * User Data Validation Pipe
 *
 * @module UserDataPipe
 * @description Pipe for validating user profile data input with comprehensive validation
 * @used_by server/features/user, server/controllers
 */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { UserProfileUpdateData, ValidationResult } from '@shared';
import { serverLogger as logger , UserDataValidationResult } from '@shared';

import { ValidationService } from '../validation/validation.service';

@Injectable()
export class UserDataPipe implements PipeTransform {
	constructor(private readonly validationService: ValidationService) {}

	async transform(value: UserProfileUpdateData): Promise<UserDataValidationResult> {
		const startTime = Date.now();

		try {
			logger.validationDebug('user_data', '[REDACTED]', 'validation_start');

			const errors: string[] = [];

			// Validate username if provided
			if (value.username) {
				const usernameValidation: ValidationResult = await this.validationService.validateUsername(value.username);
				if (!usernameValidation.isValid) {
					errors.push(...usernameValidation.errors);
				}
			}

			// Validate email if provided
			if (value.email) {
				const emailValidation: ValidationResult = await this.validationService.validateEmail(value.email);
				if (!emailValidation.isValid) {
					errors.push(...emailValidation.errors);
				}
			}

			// Password validation is handled separately in auth service

			// Validate first name if provided
			if (value.first_name) {
				const firstNameValidation: ValidationResult = await this.validationService.validateInputContent(
					value.first_name
				);
				if (!firstNameValidation.isValid) {
					errors.push(...firstNameValidation.errors);
				}
			}

			// Validate last name if provided
			if (value.last_name) {
				const lastNameValidation: ValidationResult = await this.validationService.validateInputContent(value.last_name);
				if (!lastNameValidation.isValid) {
					errors.push(...lastNameValidation.errors);
				}
			}

			const isValid = errors.length === 0;

			// Log validation result
			if (isValid) {
				logger.validationInfo('user_data', '[REDACTED]', 'validation_success');
			} else {
				logger.validationWarn('user_data', '[REDACTED]', 'validation_failed', {
					errors,
				});
			}

			// Log API call
			logger.apiUpdate('user_data_validation', {
				isValid,
				errorsCount: errors.length,
				duration: Date.now() - startTime,
			});

			return {
				isValid,
				errors,
				success: true,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.validationError('user_data', '[REDACTED]', 'validation_error', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			logger.apiUpdateError('userDataValidation', error instanceof Error ? error.message : 'Unknown error');

			throw new BadRequestException('User data validation failed');
		}
	}
}
