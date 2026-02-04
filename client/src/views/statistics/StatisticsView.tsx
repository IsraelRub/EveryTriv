import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { SKELETON_HEIGHTS, SKELETON_WIDTHS, STATISTICS_TAB_ENTRIES, STATISTICS_TAB_PARAM } from '@/constants';
import { DashboardWithTabsLayout, Skeleton } from '@/components';
import { RefreshAnimationContext } from '@/contexts';
import { useCurrentUserData, useIsAuthenticated } from '@/hooks';
import { queryInvalidationService } from '@/services';
import { buildDashboardTabsConfig } from '@/utils';

const STATISTICS_SUSPENSE_FALLBACK = (
	<div className='space-y-8'>
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
			{[...Array(4)].map((_, i) => (
				<Skeleton key={i} className={`${SKELETON_HEIGHTS.CARD} ${SKELETON_WIDTHS.FULL}`} />
			))}
		</div>
	</div>
);

const ALL_TABS_CONFIG = buildDashboardTabsConfig(STATISTICS_TAB_ENTRIES);

export function StatisticsView() {
	const queryClient = useQueryClient();
	const currentUser = useCurrentUserData();
	const isAuthenticated = useIsAuthenticated();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [refreshGeneration, setRefreshGeneration] = useState(0);

	const defaultTab = isAuthenticated ? 'performance' : 'leaderboard';

	const tabsToShow = useMemo(() => {
		return ALL_TABS_CONFIG.filter(
			tab => tab.label.toLowerCase() === 'leaderboard' || isAuthenticated
		);
	}, [isAuthenticated]);

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		try {
			await queryInvalidationService.invalidateGameQueries(queryClient, currentUser?.id);
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
