import { isErrorWithProperties, isNonEmptyString, isRecord } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { ROUTES } from '@/constants';
import type { DifficultyTooltipPoint } from '@/types';

export function isDifficultyTooltipPoint(obj: unknown): obj is DifficultyTooltipPoint {
	if (!isRecord(obj)) return false;
	const name = Object.getOwnPropertyDescriptor(obj, 'name')?.value;
	const games = Object.getOwnPropertyDescriptor(obj, 'games')?.value;
	const successRate = Object.getOwnPropertyDescriptor(obj, 'successRate')?.value;
	return isNonEmptyString(name) && VALIDATORS.number(games) && VALIDATORS.number(successRate);
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
