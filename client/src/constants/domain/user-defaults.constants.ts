/**
 * User default values constants for EveryTriv client
 * Defines default values for user creation and initialization
 *
 * @module UserDefaultsConstants
 * @description Default values for user entities and authentication
 * @used_by client/src/hooks/api/useAuth.ts, client/src/components/auth/CompleteProfile.tsx, client/src/views/registration/RegistrationView.tsx
 */

/**
 * Default credit balance values for new users
 * @constant
 * @description Default credit balance structure for new users
 * @used_by client/src/redux/slices/userSlice.ts
 */
export const CREDIT_BALANCE_DEFAULT_VALUES = {
	totalCredits: 0,
	credits: 0,
	freeQuestions: 0,
	purchasedCredits: 0,
	dailyLimit: 20,
	canPlayFree: false,
	nextResetTime: null,
} as const;
