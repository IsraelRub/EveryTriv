import { VALIDATION_COUNT } from '@shared/constants';

import { VALIDATION_MESSAGES } from '@/constants';

export function calculateTotalPages(total: number, limit: number): number {
	if (limit <= 0 || total <= 0) {
		return 0;
	}
	return Math.ceil(total / limit);
}

export function validateListQueryParams(limit?: number, offset?: number): void {
	const { LIMIT_MIN, LIMIT_MAX, OFFSET_MIN } = VALIDATION_COUNT.LIST_QUERY;
	if (limit != null && (limit < LIMIT_MIN || limit > LIMIT_MAX)) {
		throw new Error(VALIDATION_MESSAGES.LIMIT_RANGE(LIMIT_MIN, LIMIT_MAX));
	}
	if (offset != null && offset < OFFSET_MIN) {
		throw new Error(VALIDATION_MESSAGES.OFFSET_NON_NEGATIVE);
	}
}
