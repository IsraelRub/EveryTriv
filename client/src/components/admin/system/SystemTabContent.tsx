import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Bolt, Database, History, Trophy } from 'lucide-react';

import { ERROR_MESSAGES } from '@shared/constants';

import { AdminKey, isSystemSubTab, QUERY_KEYS, SYSTEM_SUB_TAB_PARAM, SYSTEM_SUB_TABS, SystemSubTab } from '@/constants';
import type { ClearOperation } from '@/types';
import { analyticsService, gameService, queryInvalidationService } from '@/services';
import {
	ConsistencyManagementSection,
	ManagementActions,
	SectionCard,
	SystemHealthSection,
	Tabs,
	TabsContent,
} from '@/components';
import { SecondaryTabsBar } from '@/components/layout';
import { useAllTriviaQuestions, useGameStatistics, useUserRole } from '@/hooks';

export function SystemTabContent() {
	const { t } = useTranslation('admin');
	const queryClient = useQueryClient();
	const { isAdmin } = useUserRole();

	const { data: gameStats, isLoading: gameStatsLoading } = useGameStatistics(true);
	const { data: triviaData, isLoading: triviaLoading } = useAllTriviaQuestions(true);

	const clearGameHistory = useMutation({
		mutationFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return gameService.clearAllGameHistory();
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.gameStatistics() });
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.gameHistory() });
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.games() });
		},
	});

	const clearTrivia = useMutation({
		mutationFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return gameService.clearAllTrivia();
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.allTriviaQuestions() });
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trivia.all });
		},
	});

	const clearUserStats = useMutation({
		mutationFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.clearAllUserStats();
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.analytics() });
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userAnalytics() });
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userSummary() });
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userStatistics() });
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userPerformance() });
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userProgress() });
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userActivity() });
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userInsights() });
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userRecommendations() });
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userTrends() });
			void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.userComparison() });
		},
	});

	const clearLeaderboard = useMutation({
		mutationFn: async () => {
			if (!isAdmin) {
				throw new Error(ERROR_MESSAGES.validation.ADMIN_ACCESS_DENIED);
			}
			return analyticsService.clearAllLeaderboard();
		},
		onSuccess: async () => {
			await queryInvalidationService.invalidateLeaderboardQueries(queryClient);
		},
	});

	const clearOperations = useMemo((): ClearOperation[] => {
		return [
			{
				id: 'clear-game-history',
				title: t(AdminKey.CLEAR_GAME_HISTORY),
				description: t(AdminKey.CLEAR_GAME_HISTORY_DESC),
				itemName: t(AdminKey.ITEM_NAME_GAME_HISTORY),
				currentCount: gameStats?.totalGames,
				isLoading: gameStatsLoading ?? clearGameHistory.isPending,
				onClear: async () => {
					await clearGameHistory.mutateAsync();
				},
				icon: History,
			},
			{
				id: 'clear-trivia',
				title: t(AdminKey.CLEAR_TRIVIA),
				description: t(AdminKey.CLEAR_TRIVIA_DESC),
				itemName: t(AdminKey.ITEM_NAME_TRIVIA_QUESTIONS),
				currentCount: triviaData?.totalCount,
				isLoading: triviaLoading ?? clearTrivia.isPending,
				onClear: async () => {
					await clearTrivia.mutateAsync();
				},
				icon: Database,
			},
			{
				id: 'clear-user-stats',
				title: t(AdminKey.CLEAR_USER_STATS),
				description: t(AdminKey.CLEAR_USER_STATS_DESC),
				itemName: t(AdminKey.ITEM_NAME_USER_STATISTICS),
				isLoading: clearUserStats.isPending,
				onClear: async () => {
					await clearUserStats.mutateAsync();
				},
				icon: BarChart3,
			},
			{
				id: 'clear-leaderboard',
				title: t(AdminKey.CLEAR_LEADERBOARD),
				description: t(AdminKey.CLEAR_LEADERBOARD_DESC),
				itemName: t(AdminKey.ITEM_NAME_LEADERBOARD_DATA),
				isLoading: clearLeaderboard.isPending,
				onClear: async () => {
					await clearLeaderboard.mutateAsync();
				},
				icon: Trophy,
			},
		];
	}, [
		t,
		gameStats?.totalGames,
		gameStatsLoading,
		triviaData?.totalCount,
		triviaLoading,
		clearGameHistory,
		clearTrivia,
		clearUserStats,
		clearLeaderboard,
	]);

	const [searchParams, setSearchParams] = useSearchParams();
	const systemSubParam = searchParams.get(SYSTEM_SUB_TAB_PARAM);
	const currentSubTab = systemSubParam && isSystemSubTab(systemSubParam) ? systemSubParam : SystemSubTab.HEALTH;

	useEffect(() => {
		if (systemSubParam == null || currentSubTab !== SystemSubTab.HEALTH) return;
		const next = new URLSearchParams(searchParams);
		next.delete(SYSTEM_SUB_TAB_PARAM);
		setSearchParams(next, { replace: true });
	}, [currentSubTab, searchParams, setSearchParams, systemSubParam]);

	const handleSubTabChange = (value: string) => {
		const next = new URLSearchParams(searchParams);
		if (value === SystemSubTab.HEALTH) {
			next.delete(SYSTEM_SUB_TAB_PARAM);
		} else {
			next.set(SYSTEM_SUB_TAB_PARAM, value);
		}
		setSearchParams(next);
	};

	return (
		<Tabs value={currentSubTab} onValueChange={handleSubTabChange} className='w-full'>
			<SecondaryTabsBar
				items={useMemo(() => SYSTEM_SUB_TABS.map(tab => ({ value: tab.value, label: t(tab.labelKey) })), [t])}
				columns={3}
			/>
			<TabsContent value={SystemSubTab.HEALTH} className='mt-0'>
				<div className='space-y-8'>
					<SystemHealthSection />
				</div>
			</TabsContent>
			<TabsContent value={SystemSubTab.CONSISTENCY} className='mt-0'>
				<div className='space-y-8'>
					<ConsistencyManagementSection />
				</div>
			</TabsContent>
			<TabsContent value={SystemSubTab.MAINTENANCE} className='mt-0'>
				<div className='space-y-8'>
					<SectionCard
						title={t(AdminKey.DATA_MAINTENANCE_TITLE)}
						icon={Bolt}
						description={t(AdminKey.DATA_MAINTENANCE_DESC)}
					>
						<ManagementActions operations={clearOperations} splitIntoTwoColumns />
					</SectionCard>
				</div>
			</TabsContent>
		</Tabs>
	);
}
