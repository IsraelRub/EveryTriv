/**
 * API Hooks Index
 *
 * @module ApiHooks
 * @description Central export point for all API-related React hooks and query keys
 * @version 1.0.0
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
	useDifficultyStats,
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
