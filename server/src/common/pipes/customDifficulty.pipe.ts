/**
 * Custom Difficulty Validation Pipe
 *
 * @module CustomDifficultyPipe
 * @description Pipe for validating custom difficulty text input with comprehensive validation
 * @used_by server/src/features/game, server/src/controllers
 */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { ValidationOptions } from '@shared';
import { CustomDifficultyValidationResult,serverLogger as logger  } from '@shared';

import { ValidationService } from '../validation/validation.service';

@Injectable()
export class CustomDifficultyPipe implements PipeTransform {
	constructor(private readonly validationService: ValidationService) {}

	async transform(value: { customText: string }): Promise<CustomDifficultyValidationResult> {
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
				suggestion: validationResult.suggestion,
				success: true,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.apiUpdateError('customDifficulty_validation', error instanceof Error ? error.message : 'Unknown error');

			if (error instanceof BadRequestException) {
				throw error;
			}

			throw new BadRequestException('Custom difficulty validation failed');
		}
	}
}
