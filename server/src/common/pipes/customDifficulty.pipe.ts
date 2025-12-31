/**
 * Custom Difficulty Validation Pipe
 *
 * @module CustomDifficultyPipe
 * @description Pipe for validating custom difficulty text input with comprehensive validation
 * @used_by server/src/features/game, server/src/controllers
 */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { ERROR_CODES } from '@shared/constants';
import type { CustomDifficultyRequest, ValidationOptions } from '@shared/types';
import { calculateDuration, getErrorMessage } from '@shared/utils';
import { serverLogger as logger } from '@internal/services';
import { ValidationService } from '../validation';

@Injectable()
export class CustomDifficultyPipe implements PipeTransform {
	constructor(private readonly validationService: ValidationService) {}

	async transform(value: CustomDifficultyRequest): Promise<CustomDifficultyRequest> {
		const startTime = Date.now();

		try {
			// Use ValidationService for validation
			const validationOptions: ValidationOptions = {};
			const validationResult = await this.validationService.validateCustomDifficultyText(
				value.customText,
				validationOptions
			);

			// Log API call for validation result
			logger.apiUpdate('customDifficulty_validation', {
				isValid: validationResult.isValid,
				errorsCount: validationResult.errors.length,
				duration: calculateDuration(startTime),
			});

			if (!validationResult.isValid) {
				throw new BadRequestException(
					validationResult.errors.join(', ') || ERROR_CODES.CUSTOM_DIFFICULTY_VALIDATION_FAILED
				);
			}

			return value;
		} catch (error) {
			logger.apiUpdateError('customDifficulty_validation', getErrorMessage(error));

			if (error instanceof BadRequestException) {
				throw error;
			}

			throw new BadRequestException(ERROR_CODES.CUSTOM_DIFFICULTY_VALIDATION_FAILED);
		}
	}
}
