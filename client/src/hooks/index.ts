/**
 * API Hooks Index
 *
 * @module ApiHooks
 * @description Central export point for all API-related React hooks and query keys
 */

/**
 * Authentication hooks
 * @description Authentication, login, registration, and current user hooks
 */
export { useCurrentUser, useLogin, useRegister } from './useAuth';

/**
 * Points management hooks
 * @description Point balance, transactions, and purchase management hooks
 */
export {
	usePointBalance,
	usePointPackages,
	usePurchasePoints,
	useCanPlay,
	useDeductPoints,
	useTransactionHistory,
} from './usePoints';

/**
 * Trivia game hooks
 * @description Trivia questions, game history, leaderboard, and custom difficulty hooks
 */
export {
	useGameHistory,
	useValidateCustomDifficulty,
	useSaveHistory,
	useTriviaQuestionMutation,
	useClearGameHistory,
	useDeleteGameHistory,
} from './useTrivia';

/**
 * User management hooks
 * @description User profile, credits, and profile update hooks
 */
export { useUpdateUserProfile, useUserProfile } from './useUser';

/**
 * Leaderboard features hooks
 * @description Leaderboard and ranking hooks
 */
export {
	useGlobalLeaderboard,
	useLeaderboardByPeriod,
	useUpdateUserRanking,
	useUserRanking,
} from './useLeaderboardFeatures';

/**
 * Analytics dashboard hooks
 * @description Analytics and statistics hooks
 */
export {
	useAnalyticsExport,
	useDifficultyStats,
	usePopularTopics,
	useRealTimeAnalytics,
	useUserAnalytics,
} from './useAnalyticsDashboard';

/**
 * Subscription management hooks
 * @description Subscription create and cancel hooks
 */
export { useCancelSubscription, useCreateSubscription } from './useSubscriptionManagement';

/**
 * User preferences hooks
 * @description User preferences management hooks
 */
export { useUpdateUserPreferences } from './useUserPreferences';

/**
 * Account management hooks
 * @description Account management functionality hooks
 */
export {
	useDeleteUserAccount,
	useDeleteUser,
	useGetUserById,
	useUpdateUserCredits,
	useUpdateUserStatus,
	useChangePassword,
	useGoogleOAuth,
	useUpdateSinglePreference,
	useUpdateUserField,
} from './useAccountManagement';

export { useUserStats } from './useUserStats';

/**
 * Validation hooks
 * @description Validation hooks
 */
export { useValidation } from './useValidation';

/**
 * Redux hooks
 * @description Redux hooks
 */
export { useAppDispatch, useAppSelector } from './useRedux';

/**
 * Utils hooks
 * @description Utils hooks
 */
export { useDebounce, useDebouncedCallback } from './useDebounce';

/**
 * Previous hooks
 * @description Previous hooks
 */
export { usePrevious, useValueChange } from './usePrevious';

/**
 * Game timer hook
 * @description Game timer management hook
 */
export { useGameTimer } from './useGameTimer';
