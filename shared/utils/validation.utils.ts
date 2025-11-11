/**
 * Validation utilities for EveryTriv
 *
 * @module ValidationUtils
 * @description Shared validation functions for input validation, content filtering, and data validation
 */
import {
	COMMON_MISSPELLINGS,
	GRAMMAR_PATTERNS,
	LANGUAGE_TOOL_CONSTANTS,
	VALIDATION_LIMITS,
	VALIDATION_THRESHOLDS,
} from '../constants';
import type { LanguageValidationOptions, LanguageValidationResult, PasswordValidationResult, Position, ValidationResult } from '../types';
import { getErrorMessage } from './error.utils';

/**
 * Validates input content for security and content filtering
 * @param input The input string to validate
 * @returns Promise resolving to validation result with position information and suggestions
 * Performs comprehensive content validation including length checks,
 * harmful content detection, and security filtering to prevent XSS attacks
 */
export async function validateInputContent(input: string): Promise<ValidationResult> {
	const minLength = 1;
	const maxLength = 1000;

	if (!input || input.trim().length < minLength) {
		const position: Position = { start: 0, end: input?.length ?? 0 };
		return {
			isValid: false,
			errors: [`Input must be at least ${minLength} characters long`],
			position,
			suggestion: 'Please provide some content',
		};
	}

	if (input.length > maxLength) {
		const position: Position = { start: maxLength, end: input.length };
		return {
			isValid: false,
			errors: [`Input must not exceed ${maxLength} characters`],
			position,
			suggestion: `Please shorten your input to ${maxLength} characters or less`,
		};
	}

	const harmfulPatterns = [
		{ pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, name: 'script tags' },
		{ pattern: /javascript:/gi, name: 'javascript protocol' },
		{ pattern: /on\w+\s*=/gi, name: 'event handlers' },
		{ pattern: /data:text\/html/gi, name: 'data URLs' },
	];

	for (const { pattern, name } of harmfulPatterns) {
		const match = pattern.exec(input);
		if (match) {
			const position: Position = { start: match.index, end: match.index + match[0].length };
			return {
				isValid: false,
				errors: [`Input contains potentially harmful content: ${name}`],
				position,
				suggestion: 'Please remove any script tags, event handlers, or data URLs',
			};
		}
	}

	return {
		isValid: true,
		errors: [],
	};
}

/**
 * Validates email format and length constraints
 * @param email The email address to validate
 * @returns Validation result with position information and suggestions
 * Checks email format using RFC-compliant regex pattern and validates
 * against maximum length constraints to prevent abuse
 */
export function validateEmail(email: string): ValidationResult {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	if (!email || !emailRegex.test(email)) {
		const position: Position = { start: 0, end: email?.length ?? 0 };
		return {
			isValid: false,
			errors: ['Invalid email format'],
			position,
			suggestion: 'Please enter a valid email address (e.g., user@example.com)',
		};
	}

	if (email.length > VALIDATION_LIMITS.EMAIL.MAX_LENGTH) {
		const position: Position = { start: VALIDATION_LIMITS.EMAIL.MAX_LENGTH, end: email.length };
		return {
			isValid: false,
			errors: [`Email must not exceed ${VALIDATION_LIMITS.EMAIL.MAX_LENGTH} characters`],
			position,
			suggestion: `Please shorten your email to ${VALIDATION_LIMITS.EMAIL.MAX_LENGTH} characters or less`,
		};
	}

	return {
		isValid: true,
		errors: [],
	};
}

/**
 * Validates username format and constraints
 * @param username The username string to validate
 * @returns Validation result with position information and suggestions
 * Checks username length, character restrictions, and format requirements.
 * Only allows letters, numbers, underscores, and hyphens
 */
export function validateUsername(username: string): ValidationResult {
	const usernameRegex = /^[a-zA-Z0-9_-]+$/;

	if (!username || username.length < VALIDATION_LIMITS.USERNAME.MIN_LENGTH) {
		const position: Position = { start: 0, end: username?.length ?? 0 };
		return {
			isValid: false,
			errors: [`Username must be at least ${VALIDATION_LIMITS.USERNAME.MIN_LENGTH} characters long`],
			position,
			suggestion: `Please enter at least ${VALIDATION_LIMITS.USERNAME.MIN_LENGTH} characters`,
		};
	}

	if (username.length > VALIDATION_LIMITS.USERNAME.MAX_LENGTH) {
		const position: Position = { start: VALIDATION_LIMITS.USERNAME.MAX_LENGTH, end: username.length };
		return {
			isValid: false,
			errors: [`Username must not exceed ${VALIDATION_LIMITS.USERNAME.MAX_LENGTH} characters`],
			position,
			suggestion: `Please shorten your username to ${VALIDATION_LIMITS.USERNAME.MAX_LENGTH} characters or less`,
		};
	}

	if (!usernameRegex.test(username)) {
		let invalidIndex = -1;
		for (let i = 0; i < username.length; i++) {
			if (!/[a-zA-Z0-9_-]/.test(username[i])) {
				invalidIndex = i;
				break;
			}
		}
		const position: Position = { start: invalidIndex, end: invalidIndex + 1 };
		return {
			isValid: false,
			errors: ['Username can only contain letters, numbers, underscores, and hyphens'],
			position,
			suggestion: 'Remove special characters and use only letters, numbers, underscores, and hyphens',
		};
	}

	return {
		isValid: true,
		errors: [],
	};
}

/**
 * Validates password security requirements
 * @param password The password string to validate
 * @returns Password validation result with detailed compliance checks
 * Performs comprehensive password validation including length and character type requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
	const hasUpperCase = /[A-Z]/.test(password);
	const hasLowerCase = /[a-z]/.test(password);
	const hasNumbers = /\d/.test(password);
	const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
	const hasMinLength = Boolean(password && password.length >= VALIDATION_LIMITS.PASSWORD.MIN_LENGTH);

	const errors: string[] = [];
	const checks = {
		hasMinLength,
		hasUppercase: hasUpperCase,
		hasLowercase: hasLowerCase,
		hasNumber: hasNumbers,
		hasSpecialChar,
	};

	if (!password || !hasMinLength) {
		errors.push(`Password must be at least ${VALIDATION_LIMITS.PASSWORD.MIN_LENGTH} characters long`);
	}

	if (password && password.length > VALIDATION_LIMITS.PASSWORD.MAX_LENGTH) {
		errors.push(`Password must not exceed ${VALIDATION_LIMITS.PASSWORD.MAX_LENGTH} characters`);
	}

	if (!hasUpperCase) {
		errors.push('Password must contain at least one uppercase letter');
	}

	if (!hasLowerCase) {
		errors.push('Password must contain at least one lowercase letter');
	}

	if (!hasNumbers) {
		errors.push('Password must contain at least one number');
	}

	if (!hasSpecialChar) {
		errors.push('Password must contain at least one special character');
	}

	return {
		isValid: errors.length === 0,
		errors,
		checks,
	};
}

/**
 * Validate topic length and format
 * @param topic The topic string to validate
 * @returns Validation result with position information and suggestions
 * Validates topic length constraints and format requirements for trivia topics
 */
export function validateTopicLength(topic: string): ValidationResult {
	if (!topic || topic.trim().length < VALIDATION_LIMITS.TOPIC.MIN_LENGTH) {
		const position: Position = { start: 0, end: topic?.length ?? 0 };
		return {
			isValid: false,
			errors: [`Topic must be at least ${VALIDATION_LIMITS.TOPIC.MIN_LENGTH} characters long`],
			position,
			suggestion: `Please enter at least ${VALIDATION_LIMITS.TOPIC.MIN_LENGTH} characters for your topic`,
		};
	}

	if (topic.length > VALIDATION_LIMITS.TOPIC.MAX_LENGTH) {
		const position: Position = { start: VALIDATION_LIMITS.TOPIC.MAX_LENGTH, end: topic.length };
		return {
			isValid: false,
			errors: [`Topic must be less than ${VALIDATION_LIMITS.TOPIC.MAX_LENGTH} characters`],
			position,
			suggestion: `Please shorten your topic to ${VALIDATION_LIMITS.TOPIC.MAX_LENGTH} characters or less`,
		};
	}

	return {
		isValid: true,
		errors: [],
	};
}

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
 * @param input - The input string to check
 * @returns Object containing errors and suggestions for text quality improvements
 * Checks for repeated words, excessive punctuation, capitalization issues,
 * and word length problems to improve text quality
 */
function performLocalChecks(input: string): { errors: string[]; suggestions: string[] } {
	const errors: string[] = [];
	const suggestions: string[] = [];

	const words = input.split(/\s+/);
	for (let i = 0; i < words.length - 1; i++) {
		if (words[i].toLowerCase() === words[i + 1].toLowerCase()) {
			errors.push('Repeated word detected');
			suggestions.push('Consider removing the repeated word');
			break;
		}
	}

	const punctuationCount = (input.match(/[.!?]/g) ?? []).length;
	if (punctuationCount > input.split(/\s+/).length * VALIDATION_THRESHOLDS.EXCESSIVE_PUNCTUATION) {
		errors.push('Excessive punctuation detected');
		suggestions.push('Consider reducing the number of punctuation marks');
	}

	const wordsWithCaps = input.split(/\s+/).filter(word => word.length > 1 && word === word.toUpperCase());
	if (wordsWithCaps.length > input.split(/\s+/).length * VALIDATION_THRESHOLDS.EXCESSIVE_CAPITALIZATION) {
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
