import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { ensureErrorObject } from '@shared/utils';

import { SKELETON_PLACEHOLDER_COUNTS, SkeletonVariant, STATISTICS_TAB_PARAM, STATISTICS_TABS } from '@/constants';
import { DashboardWithTabsLayout, Skeleton } from '@/components';
import { useCurrentUserData, useIsAuthenticated } from '@/hooks';
import { clientLogger as logger, queryInvalidationService } from '@/services';
import { buildDashboardTabsConfig } from '@/utils';
import { RefreshAnimationContext } from '@/contexts';

const loadStatisticsTab = async (name: string) => {
	switch (name) {
		case 'StatisticsPerformanceTab':
			return import('@/views/statistics/tabs/StatisticsPerformanceTab');
		case 'StatisticsHistoryTab':
			return import('@/views/statistics/tabs/StatisticsHistoryTab');
		case 'StatisticsLeaderboardTab':
			return import('@/views/statistics/tabs/StatisticsLeaderboardTab');
		default:
			throw new Error(`Unknown statistics tab: ${name}`);
	}
};

const STATISTICS_TABS_CONFIG = buildDashboardTabsConfig(STATISTICS_TABS, loadStatisticsTab);

const STATISTICS_SUSPENSE_FALLBACK = (
	<div className='space-y-8'>
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
			<Skeleton variant={SkeletonVariant.Card} count={SKELETON_PLACEHOLDER_COUNTS.CARDS} />
		</div>
	</div>
);

export function StatisticsView() {
	const queryClient = useQueryClient();
	const currentUser = useCurrentUserData();
	const isAuthenticated = useIsAuthenticated();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [refreshGeneration, setRefreshGeneration] = useState(0);

	const defaultTab = isAuthenticated ? 'performance' : 'leaderboard';
	const tabsToShow = useMemo(() => {
		return STATISTICS_TABS_CONFIG.filter(tab => tab.label.toLowerCase() === 'leaderboard' || isAuthenticated);
	}, [isAuthenticated]);

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		try {
			await queryInvalidationService.invalidateGameQueries(queryClient, currentUser?.id);
		} catch (error) {
			const err = ensureErrorObject(error);
			logger.userError('Statistics refresh failed', { errorInfo: { message: err.message } });
		} finally {
			setIsRefreshing(false);
			setRefreshGeneration(g => g + 1);
		}
	}, [queryClient, currentUser?.id]);

	return (
		<RefreshAnimationContext.Provider value={refreshGeneration}>
			<DashboardWithTabsLayout
				title='Statistics'
				description={
					isAuthenticated
						? 'View your statistics, leaderboard, and game history'
						: 'See how you rank against other players'
				}
				onRefresh={handleRefresh}
				isRefreshing={isRefreshing}
				tabs={tabsToShow}
				defaultTab={defaultTab}
				tabParam={STATISTICS_TAB_PARAM}
				suspenseFallback={STATISTICS_SUSPENSE_FALLBACK}
			/>
		</RefreshAnimationContext.Provider>
	);
}
