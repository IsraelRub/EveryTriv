/**
 * API Hooks Index
 *
 * @module ApiHooks
 * @description Central export point for all API-related React hooks and query keys
 * @author EveryTriv Team
 */

/**
 * Authentication hooks
 * @description User authentication, login, logout, and registration hooks
 * @exports {Function} Authentication-related React hooks
 */
export { useLogin, useLogout, useRegister } from './useAuth';

/**
 * Points management hooks
 * @description Point balance, transactions, and purchase management hooks
 * @exports {Function} Points-related React hooks
 */
export {
  useCanPlay,
  useDeductPoints,
  usePointBalance,
  usePointPackages,
  usePurchasePoints,
  useTransactionHistory,
} from './usePoints';

/**
 * Trivia game hooks
 * @description Trivia questions, game history, leaderboard, and custom difficulty hooks
 * @exports {Function} Trivia-related React hooks
 */
export {
  useCustomDifficulties,
  useGameHistory,
  useLeaderboard,
  useSaveCustomDifficulty,
  useTriviaQuestion,
  useUserScore,
  useValidateCustomDifficulty,
} from './useTrivia';

/**
 * User management hooks
 * @description User profile, credits, and profile update hooks
 * @exports {Function} User-related React hooks
 */
export { useDeductCredits, useUpdateUserProfile, useUserCredits, useUserProfile } from './useUser';

/**
 * Leaderboard features hooks
 * @description Leaderboard and ranking hooks
 * @exports {Function} Leaderboard-related React hooks
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
 * @exports {Function} Analytics-related React hooks
 */
export { useDifficultyStats, usePopularTopics, useUserAnalytics } from './useAnalyticsDashboard';

/**
 * Subscription management hooks
 * @description Subscription create and cancel hooks
 * @exports {Function} Subscription-related React hooks
 */
export { useCancelSubscription, useCreateSubscription } from './useSubscriptionManagement';

/**
 * User preferences hooks
 * @description User preferences management hooks
 * @exports {Function} User preferences-related React hooks
 */
export { useUpdateUserPreferences, useUserPreferences } from './useUserPreferences';

/**
 * Account management hooks
 * @description Account management functionality hooks
 * @exports {Function} Account management-related React hooks
 */
export { useDeleteUserAccount } from './useAccountManagement';

/**
 * Language validation hooks
 * @description Language validation functionality hooks
 * @exports {Function} Language validation-related React hooks
 */
export { useValidateLanguage } from './useLanguageValidation';
