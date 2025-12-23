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
 * Credits management hooks
 * @description Credit balance, transactions, and purchase management hooks
 */
export {
	useCanPlay,
	useCreditBalance,
	useCreditHistory,
	useCreditPackages,
	useDeductCredits,
	usePurchaseCredits,
} from './useCredits';

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
export { useSetAvatar, useUpdateUserProfile, useUserProfile } from './useUser';

/**
 * Leaderboard features hooks
 * @description Leaderboard and ranking hooks
 */
export { useGlobalLeaderboard, useLeaderboardByPeriod, useUserRanking } from './useLeaderboardFeatures';

/**
 * Analytics dashboard hooks
 * @description Analytics and statistics hooks
 */
export {
	useGlobalDifficultyStats,
	useGlobalStats,
	useGlobalTrends,
	usePopularTopics,
	useRealTimeAnalytics,
	useUserAnalytics,
} from './useAnalyticsDashboard';

/**
 * Admin analytics hooks
 * @description Admin-only analytics hooks for user analytics by ID
 */
export {
	useClearAllUserStats,
	useUserComparisonById,
	useUserPerformanceById,
	useUserSummaryById,
	useUserTrendsById,
} from './useAdminAnalytics';

/**
 * Admin users hooks
 * @description Admin-only hooks for user management
 */
export { useAllUsers } from './useAdminUsers';

/**
 * AI providers hooks
 * @description Admin-only hooks for AI provider statistics
 */
export { useAiProviderHealth, useAiProviderStats } from './useAiProviders';

/**
 * Admin game hooks
 * @description Admin-only hooks for game management
 */
export { useAllTriviaQuestions, useClearAllGameHistory, useClearAllTrivia, useGameStatistics } from './useAdminGame';

/**
 * Admin leaderboard hooks
 * @description Admin-only hooks for leaderboard management
 */
export { useClearAllLeaderboard } from './useAdminLeaderboard';

/**
 * User preferences hooks
 * @description User preferences management hooks
 */
export { useUpdateUserPreferences } from './useUserPreferences';

/**
 * Account management hooks
 * @description Account management functionality hooks
 */
export { useChangePassword } from './useAccountManagement';

/**
 * Redux hooks
 * @description Redux hooks
 */
export { useAppDispatch, useAppSelector } from './useRedux';

/**
 * Audio hooks
 * @description Audio context and control hooks
 */
export { AudioProvider, useAudio } from './useAudio';

/**
 * Multiplayer hooks
 * @description Multiplayer game hooks
 */
export { useMultiplayer } from './useMultiplayer';
export { useMultiplayerRoom } from './useMultiplayerRoom';

/**
 * Toast hooks
 * @description Toast notification hooks
 */
export { useToast, toast } from './useToast';

/**
 * Modal route hooks
 * @description Modal route management hooks
 */
export { useModalRoute } from './useModalRoute';

/**
 * Count up hook
 * @description Hook for animating numbers counting from 0 to target value
 */
export { useCountUp } from './useCountUp';
