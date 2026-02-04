import { VALIDATORS } from '@shared/constants';
import { isErrorWithProperties, isRecord } from '@shared/utils';

import { ROUTES } from '@/constants';
import type { ChartDataPoint, DifficultyTooltipPoint, DistributionTooltipPoint } from '@/types';

export function isDistributionTooltipPoint(obj: unknown): obj is DistributionTooltipPoint {
	if (!isRecord(obj)) return false;
	const value = Object.getOwnPropertyDescriptor(obj, 'value')?.value;
	const fullName = Object.getOwnPropertyDescriptor(obj, 'fullName')?.value;
	const count = Object.getOwnPropertyDescriptor(obj, 'count')?.value;
	return VALIDATORS.number(value) && VALIDATORS.string(fullName) && VALIDATORS.number(count);
}

export function isPieTooltipEntry(obj: unknown): obj is ChartDataPoint {
	if (!isRecord(obj)) return false;
	const name = Object.getOwnPropertyDescriptor(obj, 'name')?.value;
	const value = Object.getOwnPropertyDescriptor(obj, 'value')?.value;
	return VALIDATORS.string(name) && VALIDATORS.number(value);
}

export function isDifficultyTooltipPoint(obj: unknown): obj is DifficultyTooltipPoint {
	if (!isRecord(obj)) return false;
	const name = Object.getOwnPropertyDescriptor(obj, 'name')?.value;
	const games = Object.getOwnPropertyDescriptor(obj, 'games')?.value;
	const successRate = Object.getOwnPropertyDescriptor(obj, 'successRate')?.value;
	return VALIDATORS.string(name) && VALIDATORS.number(games) && VALIDATORS.number(successRate);
}

export function isSessionExpiredError(error: unknown): boolean {
	if (error instanceof Error) {
		return (
			error.name === 'SessionExpiredError' ||
			error.message.includes('Session expired') ||
			error.message.includes('SESSION_EXPIRED')
		);
	}

	if (isErrorWithProperties(error)) {
		return (
			error.name === 'SessionExpiredError' ||
			(error.message?.includes('Session expired') ?? false) ||
			(error.message?.includes('SESSION_EXPIRED') ?? false)
		);
	}

	return false;
}

export function isAuthPage(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}
	const currentPath = window.location.pathname;
	return currentPath === ROUTES.LOGIN || currentPath === ROUTES.REGISTER;
}
