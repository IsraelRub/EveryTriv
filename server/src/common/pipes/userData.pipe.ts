/**
 * User Data Validation Pipe
 *
 * @module UserDataPipe
 * @description Pipe for validating user profile data input with comprehensive validation
 * @used_by server/src/features/user, server/src/controllers
 */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { ERROR_CODES } from '@shared/constants';
import type { UpdateUserProfileData } from '@shared/types';
import { calculateDuration, getErrorMessage } from '@shared/utils';
import { serverLogger as logger } from '@internal/services';
import { validateName } from '@internal/validation/core';

@Injectable()
export class UserDataPipe implements PipeTransform {
	async transform(value: UpdateUserProfileData): Promise<UpdateUserProfileData> {
		const startTime = Date.now();

		try {
			logger.validationDebug('user_data', '[REDACTED]', 'validation_start');

			const errors: string[] = [];
			const suggestions: string[] = [];

			// Password validation is handled separately in auth service

			// Validate first name if provided using shared validation function
			if (value.firstName) {
				const firstNameValidation = validateName(value.firstName, 'First name');
				if (!firstNameValidation.isValid) {
					errors.push(...firstNameValidation.errors);
				}
			}

			// Validate last name if provided using shared validation function
			if (value.lastName) {
				const lastNameValidation = validateName(value.lastName, 'Last name');
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
				duration: calculateDuration(startTime),
			});

			if (!isValid) {
				throw new BadRequestException({
					message: 'User data validation failed',
					errors,
					suggestion: suggestions.length > 0 ? suggestions[0] : undefined,
				});
			}

			return value;
		} catch (error) {
			logger.validationError('user_data', '[REDACTED]', 'validation_error', {
				error: getErrorMessage(error),
			});

			logger.apiUpdateError('userDataValidation', getErrorMessage(error));

			throw new BadRequestException(ERROR_CODES.USER_DATA_VALIDATION_FAILED);
		}
	}
}
