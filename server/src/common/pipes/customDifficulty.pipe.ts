import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { ERROR_CODES } from '@shared/constants';
import type { CustomDifficultyRequest } from '@shared/types';
import { calculateDuration, getErrorMessage } from '@shared/utils';
import { validateCustomDifficultyText } from '@shared/validation';

import { serverLogger as logger } from '@internal/services';

import { LanguageToolService } from '../validation';

@Injectable()
export class CustomDifficultyPipe implements PipeTransform {
	constructor(private readonly languageToolService: LanguageToolService) {}

	async transform(value: CustomDifficultyRequest): Promise<CustomDifficultyRequest> {
		const startTime = Date.now();

		try {
			// First, perform basic validation
			const basicValidation = validateCustomDifficultyText(value.customText);

			if (!basicValidation.isValid) {
				logger.apiUpdate('customDifficulty_validation', {
					isValid: false,
					errorsCount: basicValidation.errors.length,
					duration: calculateDuration(startTime),
					validationType: 'basic',
				});

				throw new BadRequestException(
					basicValidation.errors.join(', ') || ERROR_CODES.CUSTOM_DIFFICULTY_VALIDATION_FAILED
				);
			}

			// Then, perform advanced language validation with LanguageTool (with fallback)
			const languageValidation = await this.languageToolService.checkText(value.customText, {
				enableSpellCheck: true,
				enableGrammarCheck: true,
				useExternalAPI: true, // Will fallback to local if API unavailable
			});

			// Log API call for validation result
			logger.apiUpdate('customDifficulty_validation', {
				isValid: languageValidation.isValid,
				errorsCount: languageValidation.errors.length,
				suggestionsCount: languageValidation.suggestions.length,
				confidence: languageValidation.confidence,
				duration: calculateDuration(startTime),
				validationType: 'language',
			});

			if (!languageValidation.isValid) {
				// Combine basic and language validation errors
				const allErrors = [...basicValidation.errors, ...languageValidation.errors];
				const allSuggestions = [...languageValidation.suggestions];

				throw new BadRequestException({
					message: allErrors.join(', ') || ERROR_CODES.CUSTOM_DIFFICULTY_VALIDATION_FAILED,
					errors: allErrors,
					suggestion: allSuggestions.length > 0 ? allSuggestions[0] : undefined,
				});
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
