export {
	useLogin,
	useRegister,
	useCurrentUser,
	useHasToken,
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
	useTriviaQuestionMutation,
	useClearGameHistory,
	useDeleteGameHistory,
	useGameFinalization,
	useSingleSession,
} from './game';

export {
	useSetAvatar,
	useUploadAvatar,
	useUpdateUserProfile,
	useUserProfile,
	useUpdateUserPreferences,
} from './useUser';

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
	useAdminPricing,
	useBusinessMetrics,
	useClearAllLeaderboard,
	useUpdateAdminPricing,
	useClearAllUserStats,
	useSystemInsights,
	useSystemPerformanceMetrics,
	useSystemRecommendations,
	useSystemSecurityMetrics,
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
