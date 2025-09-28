/**
 * Language Validation Pipe
 *
 * @module LanguageValidationPipe
 * @description Pipe for validating text with language tool
 * @used_by server/src/features/game, server/src/controllers
 */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { LanguageValidationOptions } from '@shared';
import { LanguageValidationData, LanguageValidationResult,serverLogger as logger, getErrorMessage  } from '@shared';

import { ValidationService } from '../validation/validation.service';

@Injectable()
export class LanguageValidationPipe implements PipeTransform {
	constructor(private readonly validationService: ValidationService) {}

	async transform(value: LanguageValidationData): Promise<LanguageValidationResult> {
		const startTime = Date.now();

		try {
			// Enhanced input validation
			if (!value.text || value.text.trim().length === 0) {
				throw new BadRequestException('Text is required');
			}

			if (value.text.length > 2000) {
				throw new BadRequestException('Text is too long (max 2000 characters)');
			}

			const languageValidation = await this.validationService.validateInputWithLanguageTool(value.text, {
				language: value.language,
				enableSpellCheck: value.enableSpellCheck ?? true,
				enableGrammarCheck: value.enableGrammarCheck ?? true,
				enableLanguageDetection: true,
			} as LanguageValidationOptions);

			// Log API call for language validation
			logger.apiUpdate('language_validation', {
				isValid: languageValidation.isValid,
				errorsCount: languageValidation.errors.length,
				language: value.language || 'auto',
				duration: Date.now() - startTime,
			});

			return {
				isValid: languageValidation.isValid,
				errors: languageValidation.errors,
				suggestions: languageValidation.suggestion ? [languageValidation.suggestion] : [],
				language: languageValidation.suggestion ? 'detected' : undefined,
			};
		} catch (error) {
			logger.apiUpdateError('languageValidation', getErrorMessage(error));

			if (error instanceof BadRequestException) {
				throw error;
			}

			throw new BadRequestException('Language validation failed');
		}
	}
}
