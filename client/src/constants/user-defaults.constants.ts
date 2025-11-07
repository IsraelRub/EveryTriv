/**
 * User default values constants for EveryTriv client
 * Defines default values for user creation and initialization
 *
 * @module UserDefaultsConstants
 * @description Default values for user entities and authentication
 * @used_by client/src/hooks/api/useAuth.ts, client/src/components/user/CompleteProfile.tsx, client/src/views/registration/RegistrationView.tsx
 */
import { UserStatus } from '@shared/constants';

/**
 * Default user values for new user creation
 * @constant
 * @description Default values when creating a new user object
 * @used_by client/src/hooks/api/useAuth.ts, client/src/components/user/CompleteProfile.tsx, client/src/views/registration/RegistrationView.tsx
 */
export const USER_DEFAULT_VALUES = {
	status: UserStatus.ACTIVE,
	emailVerified: false,
	authProvider: 'local' as const,
	credits: 0,
	purchasedPoints: 0,
	totalPoints: 0,
	score: 0,
} as const;

/**
 * Default point balance values for new users
 * @constant
 * @description Default point balance structure for new users
 * @used_by client/src/redux/slices/userSlice.ts
 */
export const POINT_BALANCE_DEFAULT_VALUES = {
	totalPoints: 0,
	freeQuestions: 0,
	purchasedPoints: 0,
	dailyLimit: 20,
	canPlayFree: false,
	nextResetTime: null,
} as const;
