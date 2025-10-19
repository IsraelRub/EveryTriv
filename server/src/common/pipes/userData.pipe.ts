/**
 * User Data Validation Pipe
 *
 * @module UserDataPipe
 * @description Pipe for validating user profile data input with comprehensive validation
 * @used_by server/src/features/user, server/src/controllers
 */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { serverLogger as logger } from '@shared/services';
import type { UserProfileUpdateData, ValidationResult } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { ValidationService } from '../validation';

@Injectable()
export class UserDataPipe implements PipeTransform {
	constructor(private readonly validationService: ValidationService) {}

	async transform(value: UserProfileUpdateData): Promise<ValidationResult> {
		const startTime = Date.now();

		try {
			logger.validationDebug('user_data', '[REDACTED]', 'validation_start');

			const errors: string[] = [];
			const suggestions: string[] = [];

			// Validate username if provided
			if (value.username) {
				const usernameValidation: ValidationResult = await this.validationService.validateUsername(value.username);
				if (!usernameValidation.isValid) {
					errors.push(...usernameValidation.errors);
					if (usernameValidation.suggestion) {
						suggestions.push(usernameValidation.suggestion);
					}
				}
			}

			// Validate email if provided
			if (value.email) {
				const emailValidation: ValidationResult = await this.validationService.validateEmail(value.email);
				if (!emailValidation.isValid) {
					errors.push(...emailValidation.errors);
					if (emailValidation.suggestion) {
						suggestions.push(emailValidation.suggestion);
					}
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
				suggestion: suggestions.length > 0 ? suggestions[0] : undefined,
			};
		} catch (error) {
			logger.validationError('user_data', '[REDACTED]', 'validation_error', {
				error: getErrorMessage(error),
			});

			logger.apiUpdateError('userDataValidation', getErrorMessage(error));

			throw new BadRequestException('User data validation failed');
		}
	}
}
