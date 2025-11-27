import { useCallback, useMemo } from 'react';

import {
	performLocalLanguageValidationAsync,
	validateCustomDifficultyText,
	validateEmail,
	validatePassword,
	validateTopicLength,
} from '@shared/validation';

import type { BasicValidationResult, ValidationHookOptions, ValidatorsMap } from '../types';

/**
 * Hook for form validation
 * @returns Validation object with validate function for different field types
 */
export function useValidation() {
	const validators: ValidatorsMap = useMemo(
		() => ({
			password: async (value: string) => Promise.resolve(validatePassword(value)),
			email: async (value: string) => Promise.resolve(validateEmail(value)),
			topic: async (value: string) => Promise.resolve(validateTopicLength(value)),
			customDifficulty: async (value: string) => Promise.resolve(validateCustomDifficultyText(value)),
			language: async (
				value: string,
				options?: ValidationHookOptions | { enableSpellCheck?: boolean; enableGrammarCheck?: boolean }
			) => {
				const languageOptions = options && 'enableSpellCheck' in options ? options : undefined;
				const result = await performLocalLanguageValidationAsync(value, {
					enableSpellCheck: languageOptions?.enableSpellCheck ?? true,
					enableGrammarCheck: languageOptions?.enableGrammarCheck ?? true,
				});
				return {
					isValid: result.isValid,
					errors: result.errors,
				};
			},
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
