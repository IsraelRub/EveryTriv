import {
	LEADERBOARD_PERIODS,
	LeaderboardPeriod,
	PAYMENT_METHODS,
	PaymentMethod,
	USER_ROLES,
	USER_STATUSES,
	UserRole,
	UserStatus,
} from '@shared/constants';
import { VALIDATORS } from '@shared/validation';

export function isPaymentMethod(value: string): value is PaymentMethod {
	return PAYMENT_METHODS.has(value);
}

export function isLeaderboardPeriod(value: string): value is LeaderboardPeriod {
	return LEADERBOARD_PERIODS.has(value);
}

export function isUserRole(value: unknown): value is UserRole {
	return VALIDATORS.string(value) && USER_ROLES.has(value);
}

export function isUserStatus(value: unknown): value is UserStatus {
	return VALIDATORS.string(value) && USER_STATUSES.has(value);
}
