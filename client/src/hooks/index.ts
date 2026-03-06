export {
	useLogin,
	useRegister,
	useCurrentUser,
	useIsAuthenticated,
	useUserRole,
	useCurrentUserData,
	useAuthLogoutHandler,
	useChangePassword,
} from './useAuth';

export {
	useCanPlay,
	useCreditBalance,
	useCreditPackages,
	useDeductCredits,
	usePaymentHistory,
	usePurchaseCredits,
} from './useCredits';

export {
	useGameHistory,
	useGameSettingsForm,
	useValidateCustomDifficulty,
	useTriviaQuestionMutation,
	useClearGameHistory,
	useDeleteGameHistory,
	useStartGameSession,
	useSubmitAnswerToSession,
	useFinalizeGameSession,
	useGameFinalization,
	useSingleSession,
} from './game';

export { useSetAvatar, useUpdateUserProfile, useUserProfile, useUpdateUserPreferences } from './useUser';

export {
	useGlobalDifficultyStats,
	useGlobalStats,
	useGlobalTrends,
	useGlobalLeaderboard,
	useLeaderboardByPeriod,
	useLeaderboardStats,
	usePopularTopics,
	useTrackAnalyticsEvent,
	useUnifiedUserAnalytics,
	useUserAnalytics,
} from './useAnalyticsDashboard';

export {
	useBusinessMetrics,
	useClearAllLeaderboard,
	useClearAllUserStats,
	useSystemInsights,
	useSystemPerformanceMetrics,
	useSystemRecommendations,
	useSystemSecurityMetrics,
	useUserAchievementsById,
	useUserInsightsById,
	useUserPerformanceById,
	useUserRecommendationsById,
	useUserStatisticsById,
	useUserSummaryById,
	useAllTriviaQuestions,
	useClearAllGameHistory,
	useClearAllTrivia,
	useGameStatistics,
	useAllUsers,
	useUserSearch,
	useAiProviderStats,
	useAiProviderHealth,
	useCheckAllUsersConsistency,
	useCheckUserStatsConsistency,
	useFixUserStatsConsistency,
} from './admin';

export { useAppDispatch, useAppSelector } from './useRedux';

export { useAudioSettings, useRouteBasedMusic } from './audio';

export { useMultiplayer } from './useMultiplayer';

export {
	useToast,
	toast,
	useModalRoute,
	useNavigationAnalytics,
	useNavigationClose,
	useCountUp,
	usePagination,
	useClientTableState,
} from './ui';

export { useAppInitialization } from './useAppInitialization';
