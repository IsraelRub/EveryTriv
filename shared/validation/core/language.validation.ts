/**
 * Language validation utilities
 *
 * @module LanguageValidation
 * @description Validation functions for spell checking and grammar validation
 */
import { COMMON_MISSPELLINGS, GRAMMAR_PATTERNS, LANGUAGE_TOOL_CONSTANTS, LANGUAGE_VALIDATION_THRESHOLDS } from '../../constants';
import type { LanguageValidationOptions, LanguageValidationResult } from '../../types';
import { getErrorMessage } from '../../utils/core/error.utils';

/**
 * Validates input using language tools for spell checking and grammar validation
 * @param input The input string to validate
 * @param options Language validation configuration options
 * @returns Promise resolving to language validation result with errors and suggestions
 * Performs local language validation as fallback when external API is unavailable.
 * Includes spell checking, grammar validation, and language detection
 */
export async function performLocalLanguageValidationAsync(
	input: string,
	options: LanguageValidationOptions = {}
): Promise<LanguageValidationResult> {
	const { enableSpellCheck = true, enableGrammarCheck = true } = options;

	try {
		if (!input || input.trim().length === 0) {
			return {
				isValid: false,
				errors: ['Input cannot be empty'],
				suggestions: [],
			};
		}

		return performLocalLanguageValidation(input, {
			enableSpellCheck,
			enableGrammarCheck,
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.warn('Language validation service failed:', {
			input,
			error: getErrorMessage(error),
		});
		return {
			isValid: false,
			errors: ['Language validation service is currently experiencing technical difficulties'],
			suggestions: ['Please try again in a few moments, or contact support if the issue persists'],
		};
	}
}

/**
 * Performs local language validation as fallback when external API is unavailable
 * @param input The input string to validate
 * @param options Language validation configuration options
 * @returns Language validation result with errors and suggestions
 * Provides basic spell checking, grammar validation, and language detection
 * using built-in patterns and dictionaries
 */
export function performLocalLanguageValidation(
	input: string,
	options: {
		enableSpellCheck?: boolean;
		enableGrammarCheck?: boolean;
	}
): LanguageValidationResult {
	const { enableSpellCheck = true, enableGrammarCheck = true } = options;

	const errors: string[] = [];
	const suggestions: string[] = [];

	if (enableSpellCheck) {
		// Type guard for checking if language is supported
		// Currently only English is supported via COMMON_MISSPELLINGS
		const words = input.toLowerCase().split(/\s+/);
		const misspellings = COMMON_MISSPELLINGS;

		for (const word of words) {
			const cleanWord = word.replace(/[^\w]/g, '');
			const misspellingEntry = Object.entries(misspellings).find(([key]) => key === cleanWord);
			if (misspellingEntry) {
				const wordSuggestions = misspellingEntry[1];
				const suggestionsForWord = Array.isArray(wordSuggestions) ? wordSuggestions : [wordSuggestions];
				errors.push(`Possible misspelling: "${word}"`);
				suggestions.push(
					...suggestionsForWord
						.filter((suggestion): suggestion is string => typeof suggestion === 'string')
						.map((suggestion: string) => `Did you mean "${suggestion}"?`)
				);
			}
		}
	}

	if (enableGrammarCheck) {
		for (const issue of GRAMMAR_PATTERNS) {
			if (issue.pattern.test(input)) {
				errors.push('Grammar issue detected');
				suggestions.push(issue.suggestion);
			}
		}
	}

	const localChecks = performLocalChecks(input);
	errors.push(...localChecks.errors);
	suggestions.push(...localChecks.suggestions);

	return {
		isValid: errors.length === 0,
		errors,
		suggestions,
		confidence: errors.length === 0 ? LANGUAGE_TOOL_CONSTANTS.CONFIDENCE.LOW : LANGUAGE_TOOL_CONSTANTS.CONFIDENCE.LOW,
	};
}

/**
 * Performs local text quality checks to complement external API validation
 * @param input The input string to check
 * @returns Object containing errors and suggestions for text quality improvements
 * Checks for repeated words, excessive punctuation, capitalization issues,
 * and word length problems to improve text quality
 */
function performLocalChecks(input: string): { errors: string[]; suggestions: string[] } {
	const errors: string[] = [];
	const suggestions: string[] = [];

	const words = input.split(/\s+/);
	for (let i = 0; i < words.length - 1; i++) {
		const currentWord = words[i];
		const nextWord = words[i + 1];
		if (currentWord != null && nextWord != null && currentWord.toLowerCase() === nextWord.toLowerCase()) {
			errors.push('Repeated word detected');
			suggestions.push('Consider removing the repeated word');
			break;
		}
	}

	const punctuationCount = (input.match(/[.!?]/g) ?? []).length;
	if (punctuationCount > input.split(/\s+/).length * LANGUAGE_VALIDATION_THRESHOLDS.EXCESSIVE_PUNCTUATION) {
		errors.push('Excessive punctuation detected');
		suggestions.push('Consider reducing the number of punctuation marks');
	}

	const wordsWithCaps = input.split(/\s+/).filter(word => word.length > 1 && word === word.toUpperCase());
	if (wordsWithCaps.length > input.split(/\s+/).length * LANGUAGE_VALIDATION_THRESHOLDS.EXCESSIVE_CAPITALIZATION) {
		errors.push('Excessive capitalization detected');
		suggestions.push('Consider using normal capitalization');
	}

	const veryShortWords = input.split(/\s+/).filter(word => word.length === 1 && /[a-zA-Z]/.test(word));
	if (veryShortWords.length > 0) {
		errors.push('Single character words detected');
		suggestions.push('Consider expanding single character words');
	}

	return { errors, suggestions };
}
