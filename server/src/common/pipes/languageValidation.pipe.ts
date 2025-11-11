/**
 * Language Validation Pipe
 *
 * @module LanguageValidationPipe
 * @description Pipe for validating text with language tool
 * @used_by server/src/features/game, server/src/controllers
 */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { serverLogger as logger } from '@shared/services';
import type { LanguageValidationOptions, LanguageValidationResult, ValidateLanguageRequest } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { ValidationService } from '../validation';

@Injectable()
export class LanguageValidationPipe implements PipeTransform {
	constructor(private readonly validationService: ValidationService) {}

	async transform(value: ValidateLanguageRequest): Promise<LanguageValidationResult> {
		const startTime = Date.now();

		try {
			// Enhanced input validation
			if (!value.text || value.text.trim().length === 0) {
				throw new BadRequestException('Text is required');
			}

			if (value.text.length > 2000) {
				throw new BadRequestException('Text is too long (max 2000 characters)');
			}

			const languageOptions: LanguageValidationOptions = {
				enableSpellCheck: value.options?.enableSpellCheck ?? true,
				enableGrammarCheck: value.options?.enableGrammarCheck ?? true,
				useExternalAPI: value.options?.useExternalAPI,
			};

			const languageValidation = await this.validationService.validateInputWithLanguageTool(
				value.text,
				languageOptions
			);

			// Log API call for language validation
			logger.apiUpdate('language_validation', {
				isValid: languageValidation.isValid,
				errorsCount: languageValidation.errors.length,
				duration: Date.now() - startTime,
			});

			return {
				isValid: languageValidation.isValid,
				errors: languageValidation.errors,
				suggestions: languageValidation.suggestion ? [languageValidation.suggestion] : [],
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
