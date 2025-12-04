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
export { useCreditBalance, useCreditPackages, usePurchaseCredits, useCanPlay, useDeductCredits } from './useCredits';

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
export { useGlobalLeaderboard, useLeaderboardByPeriod, useUserRanking } from './useLeaderboardFeatures';

/**
 * Analytics dashboard hooks
 * @description Analytics and statistics hooks
 */
export {
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
export { useUserSummaryById } from './useAdminAnalytics';

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
export { useDeleteUserAccount, useChangePassword } from './useAccountManagement';

export { useUserStats } from './useUserStats';

/**
 * Redux hooks
 * @description Redux hooks
 */
export { useAppDispatch, useAppSelector } from './useRedux';

/**
 * Utils hooks
 * @description Utils hooks
 */
export { useDebounce } from './useDebounce';

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
