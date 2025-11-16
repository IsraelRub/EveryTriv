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
 * Navigation hooks
 * @description Navigation-related state and controller hooks
 */
export { useNavigationController } from './useNavigationController';

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
	useLeaderboardStats,
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
	useGlobalStats,
	usePopularTopics,
	useRealTimeAnalytics,
	useUserAnalytics,
} from './useAnalyticsDashboard';

/**
 * Admin analytics hooks
 * @description Admin-only analytics hooks for user analytics by ID
 */
export {
	useUserStatisticsById,
	useUserPerformanceById,
	useUserProgressById,
	useUserActivityById,
	useUserInsightsById,
	useUserRecommendationsById,
	useUserAchievementsById,
	useUserTrendsById,
	useCompareUserPerformance,
	useUserSummaryById,
} from './useAdminAnalytics';

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

/**
 * Audio hooks
 * @description Audio context and control hooks
 */
export { AudioProvider, useAudio } from './useAudio';
