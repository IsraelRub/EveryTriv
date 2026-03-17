import {
	ERROR_MESSAGES,
	FORBIDDEN_CONTENT_WORDS,
	LENGTH_RULES,
	LengthKey,
	Locale,
	VALIDATION_LENGTH,
} from '@shared/constants';
import type { BaseValidationResult } from '@shared/types';

export function validateStringLength(value: string | null | undefined, lengthKey: LengthKey): BaseValidationResult {
	const { MIN, MAX } = VALIDATION_LENGTH[lengthKey];
	const { fieldName, required } = LENGTH_RULES[lengthKey];
	const len = (value ?? '').trim().length;

	if (len === 0) {
		if (required) {
			return {
				isValid: false,
				errors: [ERROR_MESSAGES.validation.FIELD_REQUIRED(fieldName)],
			};
		}
		return { isValid: true, errors: [] };
	}

	if (len < MIN) {
		return {
			isValid: false,
			errors: [ERROR_MESSAGES.validation.LENGTH_TOO_SHORT(fieldName, MIN)],
		};
	}
	if (len > MAX) {
		return {
			isValid: false,
			errors: [ERROR_MESSAGES.validation.LENGTH_TOO_LONG(fieldName, MAX)],
		};
	}

	return { isValid: true, errors: [] };
}

export function validateNoForbiddenWords(text: string, fieldName: string): BaseValidationResult {
	const lower = text.trim().toLowerCase();
	for (const word of FORBIDDEN_CONTENT_WORDS) {
		if (lower.includes(word)) {
			return {
				isValid: false,
				errors: [ERROR_MESSAGES.validation.VALID_FIELD(fieldName)],
			};
		}
	}
	return { isValid: true, errors: [] };
}

export function isPredominantlyHebrewText(text: string): boolean {
	const nonWhitespace = text.replace(/\s/g, '');
	if (nonWhitespace.length === 0) {
		return false;
	}

	const hebrewOrRtlCharacters = (nonWhitespace.match(/[\u0590-\u05FF\u0600-\u06FF]/g) ?? []).length;
	return hebrewOrRtlCharacters / nonWhitespace.length > 0.4;
}

export function matchesLocaleText(text: string, locale: Locale): boolean {
	const trimmedText = text.trim();
	if (trimmedText.length === 0) {
		return true;
	}

	const nonWhitespace = trimmedText.replace(/\s/g, '');
	if (nonWhitespace.length === 0) {
		return true;
	}

	if (locale === Locale.HE) {
		return isPredominantlyHebrewText(trimmedText);
	}

	const latinCharacters = (nonWhitespace.match(/[A-Za-z']/g) ?? []).length;
	if (latinCharacters === 0) {
		return !isPredominantlyHebrewText(trimmedText);
	}

	return !isPredominantlyHebrewText(trimmedText) && latinCharacters / nonWhitespace.length > 0.4;
}
