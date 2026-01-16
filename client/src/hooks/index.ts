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
	useValidateCustomDifficulty,
	useTriviaQuestionMutation,
	useClearGameHistory,
	useDeleteGameHistory,
	useStartGameSession,
	useSubmitAnswerToSession,
	useFinalizeGameSession,
	useGameFinalization,
	useGameSessionNavigation,
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
	useRealTimeAnalytics,
	useTrackAnalyticsEvent,
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
	useUserActivityById,
	useUserComparisonById,
	useUserInsightsById,
	useUserPerformanceById,
	useUserProgressById,
	useUserRecommendationsById,
	useUserStatisticsById,
	useUserSummaryById,
	useUserTrendsById,
	useAllTriviaQuestions,
	useClearAllGameHistory,
	useClearAllTrivia,
	useGameStatistics,
	useAllUsers,
	useAiProviderStats,
	useAiProviderHealth,
} from './admin';

export { useAppDispatch, useAppSelector } from './useRedux';

export { useAudioSettings } from './audio';

export { useMultiplayer } from './useMultiplayer';

export {
	useToast,
	toast,
	useModalRoute,
	useNavigationAnalytics,
	useNavigationClose,
	useCountUp,
	usePagination,
	useAnswerStyle,
} from './ui';

export { useAppInitialization } from './useAppInitialization';
