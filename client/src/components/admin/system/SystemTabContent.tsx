import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, Bolt, Database, History, Trophy } from 'lucide-react';

import { AdminKey, isSystemSubTab, SYSTEM_SUB_TAB_PARAM, SYSTEM_SUB_TABS, SystemSubTab } from '@/constants';
import type { ClearOperation } from '@/types';
import {
	ConsistencyManagementSection,
	ManagementActions,
	SectionCard,
	SystemHealthSection,
	Tabs,
	TabsContent,
} from '@/components';
import { SecondaryTabsBar } from '@/components/layout';
import {
	useAllTriviaQuestions,
	useClearAllGameHistory,
	useClearAllLeaderboard,
	useClearAllTrivia,
	useClearAllUserStats,
	useGameStatistics,
} from '@/hooks';

export function SystemTabContent() {
	const { t } = useTranslation('admin');
	const { data: gameStats, isLoading: gameStatsLoading } = useGameStatistics(true);
	const { data: triviaData, isLoading: triviaLoading } = useAllTriviaQuestions(true);
	const clearGameHistory = useClearAllGameHistory();
	const clearTrivia = useClearAllTrivia();
	const clearUserStats = useClearAllUserStats();
	const clearLeaderboard = useClearAllLeaderboard();

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
			<SecondaryTabsBar items={SYSTEM_SUB_TABS} columns={3} />
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
						<ManagementActions operations={clearOperations} />
					</SectionCard>
				</div>
			</TabsContent>
		</Tabs>
	);
}
