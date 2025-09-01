/**
 * Shared validation hooks for EveryTriv
 *
 * @module SharedValidationHooks
 * @description React hooks for validation that can be used across client and server
 * @used_by client/src/hooks/layers/business/useTriviaValidation.ts, client/src/components/forms
 */
import { useCallback, useEffect, useState } from 'react';

import { VALIDATION_DEBOUNCE_DELAYS, VALIDATION_HOOK_CONFIG } from '../constants';
import { clientLogger } from '../services/storage';
import {
	LanguageValidationOptions,
	StringFormValidationResult,
	ValidationContext,
	ValidationHookOptions,
	ValidationHookResult,
} from '../types';
import { validateEmail, validatePassword, validateUsername } from '../validation';

/**
 * Hook for real-time validation with debouncing
 */
export function useValidation(
	validator: (value: string, context?: ValidationContext) => { isValid: boolean; errors: string[] },
	initialValue: string = '',
	options: ValidationHookOptions = {},
	context?: ValidationContext
): ValidationHookResult {
	const {
		debounceMs = VALIDATION_DEBOUNCE_DELAYS.STANDARD,
		validateOnMount = VALIDATION_HOOK_CONFIG.DEFAULT_VALIDATE_ON_MOUNT,
		required = VALIDATION_HOOK_CONFIG.DEFAULT_REQUIRED,
	} = options;

	const [value, setValue] = useState(initialValue);
	const [isValid, setIsValid] = useState(true);
	const [errors, setErrors] = useState<string[]>([]);
	const [isValidating, setIsValidating] = useState(false);
	const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

	const validate = useCallback(
		(newValue: string) => {
			setValue(newValue);
			setIsValidating(true);

			// Clear existing timeout
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			// Set new timeout for debounced validation
			const newTimeoutId = setTimeout(() => {
				try {
					// Handle required field validation
					if (required && !newValue.trim()) {
						setIsValid(false);
						setErrors(['This field is required']);
						setIsValidating(false);
						return;
					}

					// Skip validation for empty non-required fields
					if (!required && !newValue.trim()) {
						setIsValid(true);
						setErrors([]);
						setIsValidating(false);
						return;
					}

					// Perform validation
					const result = validator(newValue, context);
					setIsValid(result.isValid);
					setErrors(result.errors);
				} catch (error) {
					clientLogger.validationError('validation', newValue, 'validation_failed', {
						error: error instanceof Error ? error.message : 'Unknown error',
					});
					setIsValid(false);
					setErrors(['Validation failed']);
				} finally {
					setIsValidating(false);
				}
			}, debounceMs);

			setTimeoutId(newTimeoutId);
		},
		[validator, debounceMs, required, timeoutId]
	);

	const clearValidation = useCallback(() => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		setValue('');
		setIsValid(true);
		setErrors([]);
		setIsValidating(false);
		setTimeoutId(null);
	}, [timeoutId]);

	// Validate on mount if requested
	useEffect(() => {
		if (validateOnMount && initialValue) {
			validate(initialValue);
		}
	}, [validateOnMount, initialValue, validate]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [timeoutId]);

	return {
		isValid,
		errors,
		isValidating,
		value,
		validate,
		clearValidation,
	};
}

/**
 * Hook for username validation
 */
export function useUsernameValidation(
	initialValue: string = '',
	options: ValidationHookOptions = {},
	context?: ValidationContext
): ValidationHookResult {
	const adaptedValidator = (value: string, ctx?: ValidationContext) => {
		const result = validateUsername(value);
		// Use context for enhanced validation if available
		if (ctx?.options?.strict && result.errors.length > 0) {
			return {
				isValid: false,
				errors: [...result.errors, 'Strict validation mode enabled'],
			};
		}
		return {
			isValid: result.isValid,
			errors: result.errors,
		};
	};
	return useValidation(adaptedValidator, initialValue, options, context);
}

/**
 * Hook for password validation
 */
export function usePasswordValidation(
	initialValue: string = '',
	options: ValidationHookOptions = {},
	context?: ValidationContext
): ValidationHookResult {
	const adaptedValidator = (value: string, ctx?: ValidationContext) => {
		const result = validatePassword(value);
		// Use context for enhanced validation if available
		if (ctx?.options?.strict && result.errors.length > 0) {
			return {
				isValid: false,
				errors: [...result.errors, 'Strict validation mode enabled'],
			};
		}
		return {
			isValid: result.isValid,
			errors: result.errors,
		};
	};
	return useValidation(adaptedValidator, initialValue, options, context);
}

/**
 * Hook for email validation
 */
export function useEmailValidation(
	initialValue: string = '',
	options: ValidationHookOptions = {},
	context?: ValidationContext
): ValidationHookResult {
	const adaptedValidator = (value: string, ctx?: ValidationContext) => {
		const result = validateEmail(value);
		// Use context for enhanced validation if available
		if (ctx?.options?.strict && result.errors.length > 0) {
			return {
				isValid: false,
				errors: [...result.errors, 'Strict validation mode enabled'],
			};
		}
		return {
			isValid: result.isValid,
			errors: result.errors,
		};
	};
	return useValidation(adaptedValidator, initialValue, options, context);
}

/**
 * Simple topic validation function
 */
function validateTopic(topic: string, ctx?: ValidationContext): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];
	const trimmedTopic = topic.trim();

	if (trimmedTopic.length < 3) {
		errors.push('Topic must be at least 3 characters long');
	}

	if (trimmedTopic.length > 100) {
		errors.push('Topic must be less than 100 characters');
	}

	// Use context for enhanced validation if available
	if (ctx?.options?.strict && errors.length > 0) {
		errors.push('Strict validation mode enabled');
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Simple custom difficulty validation function
 */
function validateCustomDifficulty(difficulty: string, ctx?: ValidationContext): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];
	const trimmedDifficulty = difficulty.trim();

	if (trimmedDifficulty.length < 3) {
		errors.push('Custom difficulty must be at least 3 characters long');
	}

	if (trimmedDifficulty.length > 50) {
		errors.push('Custom difficulty must be less than 50 characters');
	}

	// Use context for enhanced validation if available
	if (ctx?.options?.strict && errors.length > 0) {
		errors.push('Strict validation mode enabled');
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Hook for topic validation
 */
export function useTopicValidation(
	initialValue: string = '',
	options: ValidationHookOptions = {},
	context?: ValidationContext
): ValidationHookResult {
	return useValidation(validateTopic, initialValue, options, context);
}

/**
 * Hook for custom difficulty validation
 */
export function useCustomDifficultyValidation(
	initialValue: string = '',
	options: ValidationHookOptions = {},
	context?: ValidationContext
): ValidationHookResult {
	return useValidation(validateCustomDifficulty, initialValue, options, context);
}

/**
 * Hook for form validation with string-based fields
 */
export function useStringFormValidation(
	validators: Record<string, (value: string) => { isValid: boolean; errors: string[] }>,
	initialValues: Record<string, string> = {},
	_options: ValidationHookOptions = {}
): StringFormValidationResult {
	const [values, setValues] = useState<Record<string, string>>(initialValues);
	const [errors, setErrors] = useState<Record<string, string[]>>({});
	const [isValidating, setIsValidating] = useState(false);

	const validateField = useCallback(
		(field: string, value: string) => {
			const validator = validators[field];
			if (!validator) return;

			const result = validator(value);
			setErrors(prev => ({
				...prev,
				[field]: result.errors,
			}));
		},
		[validators]
	);

	const validateAll = useCallback(() => {
		setIsValidating(true);

		const newErrors: Record<string, string[]> = {};
		let allValid = true;

		Object.keys(validators).forEach(field => {
			const value = values[field];
			const validator = validators[field];

			if (validator) {
				const result = validator(String(value || ''));
				newErrors[field] = result.errors;
				if (!result.isValid) {
					allValid = false;
				}
			}
		});

		setErrors(newErrors);
		setIsValidating(false);
		return allValid;
	}, [validators, values]);

	const setFieldValue = useCallback(
		(field: string, value: string) => {
			setValues(prev => ({
				...prev,
				[field]: value,
			}));
			validateField(field, value);
		},
		[validateField]
	);

	const reset = useCallback(() => {
		setValues(initialValues);
		setErrors({});
		setIsValidating(false);
	}, [initialValues]);

	const isValid = Object.values(errors).every(fieldErrors => fieldErrors.length === 0);

	return {
		values,
		errors,
		isValid,
		isValidating,
		setFieldValue,
		validateField,
		validateAll,
		setValues,
		reset,
	};
}

/**
 * Hook for language validation with spell check and grammar
 */
export function useLanguageValidation(
	initialValue: string = '',
	options: ValidationHookOptions & LanguageValidationOptions = {}
): ValidationHookResult {
	const { language = 'en', enableSpellCheck = true, enableGrammarCheck = true, ...validationOptions } = options;

	const validator = useCallback(
		(value: string) => {
			// For now, return basic validation until we implement async validation
			// In a real implementation, this would call the API
			const errors: string[] = [];

			if (!value.trim()) {
				errors.push('Text cannot be empty');
			}

			// Basic spell check simulation
			if (enableSpellCheck) {
				const commonMisspellings = ['recieve', 'seperate', 'occured', 'begining'];
				const words = value.toLowerCase().split(/\s+/);

				for (const word of words) {
					if (commonMisspellings.includes(word)) {
						errors.push(`Possible misspelling: "${word}"`);
					}
				}
			}

			return {
				isValid: errors.length === 0,
				errors,
			};
		},
		[enableSpellCheck, enableGrammarCheck, language]
	);

	return useValidation(validator, initialValue, validationOptions);
}
