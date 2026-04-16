import { TIME_DURATIONS_SECONDS, TIME_PERIODS_MS } from '@shared/constants';
import { VALIDATORS } from '@shared/validation';

import { isNonEmptyString } from './data.utils';

/**
 * Optional date from JSON or query: missing / blank → `undefined`;
 * otherwise `Date` (invalid ISO still yields an invalid `Date` for `@IsDate` to reject).
 */
export function parseOptionalJsonDate(value: unknown): Date | undefined {
	if (value == null || value === '') {
		return undefined;
	}
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? undefined : value;
	}
	if (VALIDATORS.number(value) && Number.isFinite(value)) {
		const d = new Date(value);
		return Number.isNaN(d.getTime()) ? undefined : d;
	}
	if (VALIDATORS.string(value)) {
		if (!isNonEmptyString(value)) {
			return undefined;
		}
		return new Date(value.trim());
	}
	return undefined;
}

export function calculateClockOffset(serverTimestamp: number): number {
	const clientTime = Date.now();
	return clientTime - serverTimestamp;
}

export function validateClockOffset(
	offset: number,
	thresholdSeconds: number = TIME_DURATIONS_SECONDS.FIVE_SECONDS
): boolean {
	const thresholdMs = thresholdSeconds * TIME_PERIODS_MS.SECOND;
	const absOffset = Math.abs(offset);
	return absOffset <= thresholdMs;
}

export function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}
