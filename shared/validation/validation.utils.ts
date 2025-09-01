/**
 * Validation utilities for EveryTriv
 *
 * @module ValidationUtils
 * @description Shared validation functions for input validation, content filtering, and data validation
 * @version 1.0.0
 * @author EveryTriv Team
 */
import { VALIDATION_LIMITS } from '../constants';
import {
	COMMON_MISSPELLINGS,
	GRAMMAR_PATTERNS,
	LANGUAGE_DETECTION,
	LANGUAGE_TOOL_CONSTANTS,
} from '../constants/language.constants';
import { VALIDATION_THRESHOLDS } from '../constants/validation.constants';
import { LanguageValidationOptions, LanguageValidationResult } from '../types/language.types';
import type { PasswordStrength, PasswordValidationResult, Position, ValidationResult } from '../types/validation.types';

/**
 * Validates input content for security and content filtering
 *
 * @param input - The input string to validate
 * @returns Promise<ValidationResult> Validation result with position information and suggestions
 * @description Performs comprehensive content validation including length checks, harmful content detection, and security filtering
 */
export async function validateInputContent(input: string): Promise<ValidationResult> {
	const minLength = 1;
	const maxLength = 1000;

	if (!input || input.trim().length < minLength) {
		const position: Position = { start: 0, end: input?.length || 0 };
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
 * Validates email format and length
 *
 * @param email - The email address to validate
 * @returns ValidationResult Validation result with position information and suggestions
 * @description Checks email format using regex pattern and validates against maximum length constraints
 */
export function validateEmail(email: string): ValidationResult {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	if (!email || !emailRegex.test(email)) {
		const position: Position = { start: 0, end: email?.length || 0 };
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
 *
 * @param username - The username string to validate
 * @returns ValidationResult Validation result with position information and suggestions
 * @description Checks username length, character restrictions, and format requirements
 */
export function validateUsername(username: string): ValidationResult {
	const usernameRegex = /^[a-zA-Z0-9_-]+$/;

	if (!username || username.length < VALIDATION_LIMITS.USERNAME.MIN_LENGTH) {
		const position: Position = { start: 0, end: username?.length || 0 };
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
 * Validates password strength and security requirements
 *
 * @param password - The password string to validate
 * @returns PasswordValidationResult Validation result with strength analysis and security checks
 * @description Performs comprehensive password validation including length, character types, and strength scoring
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

	let score = 0;
	if (hasMinLength) score += 20;
	if (hasUpperCase) score += 20;
	if (hasLowerCase) score += 20;
	if (hasNumbers) score += 20;
	if (hasSpecialChar) score += 20;

	let strength: PasswordStrength = 'weak';
	if (score >= 80) strength = 'strong';
	else if (score >= 60) strength = 'medium';

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
		strength,
		score,
		checks,
	};
}

/**
 * Validate topic length
 * @param topic The topic to validate
 * @returns ValidationResult Validation result with position information
 */
export function validateTopicLength(topic: string): ValidationResult {
	if (!topic || topic.trim().length < VALIDATION_LIMITS.TOPIC.MIN_LENGTH) {
		const position: Position = { start: 0, end: topic?.length || 0 };
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
 *
 * @param input - The input string to validate
 * @param options - Language validation configuration options
 * @returns Promise<LanguageValidationResult> Language validation result with errors and suggestions
 * @description Performs local language validation as fallback when external API is unavailable
 */
export async function validateInputWithLanguageTool(
	input: string,
	options: LanguageValidationOptions = {}
): Promise<LanguageValidationResult> {
	const {
		language = LANGUAGE_TOOL_CONSTANTS.LANGUAGES.AUTO,
		enableSpellCheck = true,
		enableGrammarCheck = true,
		enableLanguageDetection = true,
	} = options;

	try {
		if (!input || input.trim().length === 0) {
			return {
				isValid: false,
				errors: ['Input cannot be empty'],
				suggestions: [],
			};
		}

		return performLocalLanguageValidation(input, {
			language,
			enableSpellCheck,
			enableGrammarCheck,
			enableLanguageDetection,
		});
	} catch (error) {
		return {
			isValid: false,
			errors: ['Language validation service temporarily unavailable'],
			suggestions: ['Please try again later'],
		};
	}
}

/**
 * Performs local language validation as fallback when external API is unavailable
 *
 * @param input - The input string to validate
 * @param options - Language validation configuration options
 * @returns LanguageValidationResult Local validation result with errors and suggestions
 * @description Provides basic spell checking, grammar validation, and language detection
 */
function performLocalLanguageValidation(
	input: string,
	options: {
		language?: string;
		enableSpellCheck?: boolean;
		enableGrammarCheck?: boolean;
		enableLanguageDetection?: boolean;
	}
): LanguageValidationResult {
	const {
		language = LANGUAGE_TOOL_CONSTANTS.LANGUAGES.ENGLISH,
		enableSpellCheck = true,
		enableGrammarCheck = true,
		enableLanguageDetection = true,
	} = options;

	const errors: string[] = [];
	const suggestions: string[] = [];
	let detectedLanguage = language;

	if (enableLanguageDetection) {
		const hebrewCount = (input.match(LANGUAGE_DETECTION.HEBREW_CHARS) || []).length;
		const englishCount = (input.match(LANGUAGE_DETECTION.ENGLISH_CHARS) || []).length;

		if (hebrewCount > englishCount) {
			detectedLanguage = LANGUAGE_TOOL_CONSTANTS.LANGUAGES.HEBREW;
		} else if (englishCount > hebrewCount) {
			detectedLanguage = LANGUAGE_TOOL_CONSTANTS.LANGUAGES.ENGLISH;
		}
	}

	if (enableSpellCheck && detectedLanguage in COMMON_MISSPELLINGS) {
		const words = input.toLowerCase().split(/\s+/);
		const misspellings = COMMON_MISSPELLINGS[detectedLanguage as keyof typeof COMMON_MISSPELLINGS];

		for (const word of words) {
			const cleanWord = word.replace(/[^\w\u0590-\u05FF]/g, '');
			if (cleanWord in misspellings) {
				const suggestionsForWord = misspellings[cleanWord as keyof typeof misspellings] as readonly string[];
				errors.push(`Possible misspelling: "${word}"`);
				suggestions.push(...suggestionsForWord.map((suggestion: string) => `Did you mean "${suggestion}"?`));
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
		language: detectedLanguage,
		confidence: errors.length === 0 ? LANGUAGE_TOOL_CONSTANTS.CONFIDENCE.LOW : LANGUAGE_TOOL_CONSTANTS.CONFIDENCE.LOW,
	};
}

/**
 * Performs local text quality checks to complement external API validation
 *
 * @param input - The input string to check
 * @returns Object containing errors and suggestions for text quality improvements
 * @description Checks for repeated words, excessive punctuation, capitalization, and word length issues
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

	const punctuationCount = (input.match(/[.!?]/g) || []).length;
	if (punctuationCount > input.split(/\s+/).length * VALIDATION_THRESHOLDS.EXCESSIVE_PUNCTUATION) {
		errors.push('Excessive punctuation detected');
		suggestions.push('Consider reducing the number of punctuation marks');
	}

	const wordsWithCaps = input.split(/\s+/).filter(word => word.length > 1 && word === word.toUpperCase());
	if (wordsWithCaps.length > input.split(/\s+/).length * VALIDATION_THRESHOLDS.EXCESSIVE_CAPITALIZATION) {
		errors.push('Excessive capitalization detected');
		suggestions.push('Consider using normal capitalization');
	}

	const veryShortWords = input.split(/\s+/).filter(word => word.length === 1 && /[a-zA-Z\u0590-\u05FF]/.test(word));
	if (veryShortWords.length > 0) {
		errors.push('Single character words detected');
		suggestions.push('Consider expanding single character words');
	}

	return { errors, suggestions };
}
