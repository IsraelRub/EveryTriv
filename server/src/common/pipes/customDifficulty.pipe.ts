/**
 * Custom Difficulty Validation Pipe
 *
 * @module CustomDifficultyPipe
 * @description Pipe for validating custom difficulty text input with comprehensive validation
 * @used_by server/src/features/game, server/src/controllers
 */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { serverLogger as logger } from '@shared/services';
import type { ValidationOptions } from '@shared/types';
import { getErrorMessage,PipeValidationWithSuggestion } from '@shared/utils';

import { ValidationService } from '../validation';

@Injectable()
export class CustomDifficultyPipe implements PipeTransform {
	constructor(private readonly validationService: ValidationService) {}

	async transform(value: { customText: string }): Promise<PipeValidationWithSuggestion> {
		const startTime = Date.now();

		try {
			// Use ValidationService for validation
			const validationResult = await this.validationService.validateCustomDifficultyText(
				value.customText,
				{} as ValidationOptions
			);

			// Log API call for validation result
			logger.apiUpdate('customDifficulty_validation', {
				isValid: validationResult.isValid,
				errorsCount: validationResult.errors.length,
				duration: Date.now() - startTime,
			});

			return {
				isValid: validationResult.isValid,
				errors: validationResult.errors,
				suggestion: validationResult.suggestion || undefined,
			};
		} catch (error) {
			logger.apiUpdateError('customDifficulty_validation', getErrorMessage(error));

			if (error instanceof BadRequestException) {
				throw error;
			}

			throw new BadRequestException('Custom difficulty validation failed');
		}
	}
}
