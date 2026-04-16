import { MAX_POINTS_PER_QUESTION, TIME_PERIODS_MS } from '@shared/constants';
import { VALIDATORS } from '@shared/validation';

import { isNonEmptyString } from './data.utils';

/**
 * Optional query/body numeric field: missing or blank → `undefined`;
 * non-empty string that does not parse as an integer → `NaN` (so `@IsNumber` fails on invalid input).
 */
export function parseOptionalQueryInt(value: unknown): number | undefined {
	if (value == null || value === '') {
		return undefined;
	}
	if (VALIDATORS.number(value)) {
		return Number.isInteger(value) ? value : Math.floor(value);
	}
	if (VALIDATORS.string(value)) {
		if (!isNonEmptyString(value)) {
			return undefined;
		}
		const parsed = parseInt(value.trim(), 10);
		return Number.isNaN(parsed) ? Number.NaN : parsed;
	}
	return undefined;
}

/**
 * Required JSON numeric field: missing, blank, unparseable, or unsupported type → `undefined`
 * (works with `@IsNotEmpty` / `@IsNumber` on DTOs).
 */
export function parseRequiredNumericInput(value: unknown): number | undefined {
	const coerced = parseOptionalQueryInt(value);
	if (coerced !== undefined && Number.isNaN(coerced)) {
		return undefined;
	}
	return coerced;
}

/**
 * Query integer: missing / blank / whitespace-only → `defaultValue`;
 * non-empty invalid string → `NaN` (so `@IsNumber` rejects); valid → integer.
 */
export function parseQueryIntDefaultWhenMissing(value: unknown, defaultValue: number): number {
	if (value == null || value === '') {
		return defaultValue;
	}
	const coerced = parseOptionalQueryInt(value);
	if (coerced === undefined) {
		return defaultValue;
	}
	return coerced;
}

/**
 * Query integer: missing, blank, whitespace-only, or invalid parse → `defaultValue` (lenient APIs).
 */
export function parseQueryIntWithDefault(value: unknown, defaultValue: number): number {
	const coerced = parseOptionalQueryInt(value);
	if (coerced === undefined || Number.isNaN(coerced)) {
		return defaultValue;
	}
	return coerced;
}

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function sum(numbers: number[]): number {
	return numbers.reduce((a, b) => a + b, 0);
}

export function sumBy<T>(arr: T[], getValue: (item: T) => number): number {
	return arr.reduce((s, item) => s + getValue(item), 0);
}

export function mean(numbers: number[]): number {
	return numbers.length === 0 ? 0 : sum(numbers) / numbers.length;
}

export function meanBy<T>(arr: T[], getValue: (item: T) => number): number {
	return arr.length === 0 ? 0 : sumBy(arr, getValue) / arr.length;
}

export function getCurrentTimestampInSeconds(): number {
	return Math.floor(Date.now() / TIME_PERIODS_MS.SECOND);
}

export function calculateDuration(startTime: number): number {
	return Date.now() - startTime;
}

export function calculateElapsedSeconds(startTime: number): number {
	return Math.floor(calculateDuration(startTime) / TIME_PERIODS_MS.SECOND);
}

export function calculatePercentage(value: number, total: number, round: boolean = true): number {
	if (total === 0) return 0;
	const percentage = (value / total) * 100;
	return round ? Math.round(percentage) : percentage;
}

export function calculateScoreRate(score: number, totalQuestions: number): number {
	if (totalQuestions === 0) return 0;
	return Math.min(100, Math.round((100 * (score / totalQuestions)) / MAX_POINTS_PER_QUESTION));
}
