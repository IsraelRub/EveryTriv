import {
	ERROR_MESSAGES,
	FORBIDDEN_CONTENT_WORDS,
	LANGUAGE_VALIDATION_THRESHOLDS,
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

/** Hebrew matres lectionis (letters often carrying vowel role) */
const HEBREW_MATRES = /[\u05D0\u05D5\u05D9\u05D4\u05E2]/;

const ENGLISH_VOWELS = /[aeiouAEIOU]/;

/**
 * Detects gibberish / keyboard-mash input that is unlikely to be caught by LanguageTool alone.
 * Applies to Hebrew and Latin-heavy text.
 */
export function isLikelyGibberish(text: string): boolean {
	const cleaned = text.replace(/[\s\p{P}\p{S}\d]/gu, '');
	if (cleaned.length < LANGUAGE_VALIDATION_THRESHOLDS.GIBBERISH_MIN_CLEANED_LENGTH) {
		return false;
	}

	const uniqueChars = new Set(cleaned).size;
	const uniqueRatio = uniqueChars / cleaned.length;
	if (uniqueRatio <= LANGUAGE_VALIDATION_THRESHOLDS.GIBBERISH_MAX_UNIQUE_TO_LENGTH_RATIO) {
		return true;
	}

	const minSameCharRepeats = LANGUAGE_VALIDATION_THRESHOLDS.GIBBERISH_MAX_SAME_CHAR_STREAK - 1;
	const sameCharStreak = new RegExp(`(.)\\1{${minSameCharRepeats},}`);
	if (sameCharStreak.test(cleaned)) {
		return true;
	}

	const isHebrew = isPredominantlyHebrewText(text);

	if (isHebrew) {
		const hebrewLettersOnly = cleaned.replace(/[^\u0590-\u05FF]/g, '');
		if (hebrewLettersOnly.length >= LANGUAGE_VALIDATION_THRESHOLDS.GIBBERISH_HEBREW_MIN_LETTERS_FOR_MATRES_CHECK) {
			let streakWithoutMatres = 0;
			let maxStreak = 0;
			for (const ch of hebrewLettersOnly) {
				if (HEBREW_MATRES.test(ch)) {
					streakWithoutMatres = 0;
				} else {
					streakWithoutMatres++;
					maxStreak = Math.max(maxStreak, streakWithoutMatres);
				}
			}
			if (maxStreak >= LANGUAGE_VALIDATION_THRESHOLDS.GIBBERISH_HEBREW_MAX_STREAK_WITHOUT_MATRES) {
				return true;
			}
		}
	} else {
		const latinOnly = cleaned.replace(/[^a-zA-Z]/g, '');
		if (latinOnly.length >= LANGUAGE_VALIDATION_THRESHOLDS.GIBBERISH_LATIN_MIN_LETTERS_FOR_CONSONANT_CHECK) {
			let consonantStreak = 0;
			let maxStreak = 0;
			for (const ch of latinOnly) {
				if (ENGLISH_VOWELS.test(ch)) {
					consonantStreak = 0;
				} else {
					consonantStreak++;
					maxStreak = Math.max(maxStreak, consonantStreak);
				}
			}
			if (maxStreak >= LANGUAGE_VALIDATION_THRESHOLDS.GIBBERISH_MAX_CONSONANT_STREAK_EN) {
				return true;
			}
		}
	}

	const words = text
		.trim()
		.split(/\s+/)
		.filter(w => w.length > 0);
	const minSingleCharWords = LANGUAGE_VALIDATION_THRESHOLDS.GIBBERISH_MIN_SINGLE_CHAR_WORD_COUNT;
	if (words.length >= minSingleCharWords && words.every(w => w.replace(/[\p{P}]/gu, '').length <= 1)) {
		return true;
	}

	return false;
}
