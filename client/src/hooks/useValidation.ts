import { useCallback, useMemo, useRef } from 'react';

import { clientLogger as logger } from '@shared/services';
import { getErrorMessage, validateEmail, validatePassword, validateTopicLength, validateUsername } from '@shared/utils';
import { validateCustomDifficultyText } from '@shared/validation';

import { apiService } from '../services';
import type { BasicValidationResult, ValidationHookOptions, ValidatorsMap } from '../types';

export function useValidation() {
	const languageTimerRef = useRef<number | null>(null);

	const validators: ValidatorsMap = useMemo(
		() => ({
			username: async (value: string) => Promise.resolve(validateUsername(value)),
			password: async (value: string) => Promise.resolve(validatePassword(value)),
			email: async (value: string) => Promise.resolve(validateEmail(value)),
			topic: async (value: string) => Promise.resolve(validateTopicLength(value)),
			customDifficulty: async (value: string) => Promise.resolve(validateCustomDifficultyText(value)),
			language: async (
				value: string,
				options?: ValidationHookOptions | { enableSpellCheck?: boolean; enableGrammarCheck?: boolean }
			) =>
				new Promise(resolve => {
					if (languageTimerRef.current) {
						window.clearTimeout(languageTimerRef.current);
					}
					languageTimerRef.current = window.setTimeout(async () => {
						try {
							// Only pass language-specific options to the API
							const languageOptions: { enableSpellCheck?: boolean; enableGrammarCheck?: boolean } = {};
							if (options && 'enableSpellCheck' in options) languageOptions.enableSpellCheck = options.enableSpellCheck;
							if (options && 'enableGrammarCheck' in options)
								languageOptions.enableGrammarCheck = options.enableGrammarCheck;

							const res = await apiService.validateLanguage(value, languageOptions);
							resolve({ isValid: res.isValid, errors: res.errors ?? [] });
						} catch (error) {
							logger.validationWarn('language_validation_client_failed', value, 'client_language_validation_failed', {
								error: getErrorMessage(error),
							});
							resolve({ isValid: false, errors: ['Language validation failed'] });
						}
					}, 350);
				}),
		}),
		[]
	);

	type ValidatorKey = keyof ValidatorsMap;

	const validate = useCallback(
		async (
			type: ValidatorKey,
			value: string,
			options?: ValidationHookOptions | { enableSpellCheck?: boolean; enableGrammarCheck?: boolean }
		): Promise<BasicValidationResult> => {
			const validator = validators[type];
			if (!validator) return Promise.resolve({ isValid: true, errors: [] });
			// Validator accepts union type, so we can pass options directly
			return validator(value, options);
		},
		[validators]
	);

	return { validate };
}
