import type { TFunction } from 'i18next';

import { ERROR_MESSAGES } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { ERROR_CODE_PATTERN, ErrorsKey } from '@/constants';

const VALIDATION_MESSAGE_TO_KEY: Record<string, string> = {
	[ERROR_MESSAGES.validation.ENTER_IN_ENGLISH]: ErrorsKey.ENTER_IN_ENGLISH,
	[ERROR_MESSAGES.validation.ENTER_IN_HEBREW]: ErrorsKey.ENTER_IN_HEBREW,
	[ERROR_MESSAGES.validation.SPELLING_OR_GRAMMAR_ISSUE]: ErrorsKey.SPELLING_OR_GRAMMAR_ISSUE,
	[ERROR_MESSAGES.validation.INPUT_VALIDATION_FAILED]: ErrorsKey.INPUT_VALIDATION_FAILED,
	[ERROR_MESSAGES.validation.INVALID_INPUT_DATA]: ErrorsKey.INVALID_INPUT_DATA,
};

const VALIDATION_PATTERNS: Array<{
	pattern: RegExp;
	key: string;
	params: (match: RegExpMatchArray) => Record<string, string | number>;
}> = [
	{
		pattern: /^(.+?) must be at least (\d+) character(s)? long$/,
		key: ErrorsKey.LENGTH_TOO_SHORT,
		params: m => ({ field: m[1] ?? '', min: Number(m[2]) }),
	},
	{
		pattern: /^(.+?) cannot exceed (\d+) characters$/,
		key: ErrorsKey.LENGTH_TOO_LONG,
		params: m => ({ field: m[1] ?? '', max: Number(m[2]) }),
	},
	{
		pattern: /^(.+?) is required$/,
		key: ErrorsKey.FIELD_REQUIRED,
		params: m => ({ field: m[1] ?? '' }),
	},
	{
		pattern: /^Please enter a valid (.+)$/,
		key: ErrorsKey.VALID_FIELD,
		params: m => ({ field: m[1] ?? '' }),
	},
];

export function translateValidationMessage(message: string, t: TFunction): string {
	if (typeof message !== 'string') return message;
	const trimmed = message.trim();
	if (!trimmed) return message;

	const exactKey = VALIDATION_MESSAGE_TO_KEY[trimmed];
	if (exactKey) return t(exactKey);

	for (const { pattern, key, params } of VALIDATION_PATTERNS) {
		const match = trimmed.match(pattern);
		if (match) return t(key, params(match));
	}

	return message;
}

export function getTranslatedErrorMessage(t: TFunction, error: unknown): string {
	const msg = getErrorMessage(error);
	if (typeof msg !== 'string') return msg;

	const validationTranslated = translateValidationMessage(msg, t);
	if (validationTranslated !== msg) return validationTranslated;

	if (!ERROR_CODE_PATTERN.test(msg)) return msg;
	const key = `errors:${msg}`;
	const translated = t(key);
	return translated === key ? msg : translated;
}
