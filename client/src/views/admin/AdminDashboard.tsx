import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { DashboardWithTabsLayout } from '@/components';
import { ADMIN_TAB_ENTRIES } from '@/constants';
import { RefreshAnimationContext } from '@/contexts';
import { useRealTimeAnalytics } from '@/hooks';
import { queryInvalidationService } from '@/services';
import { buildDashboardTabsConfig } from '@/utils';

const TABS_CONFIG = buildDashboardTabsConfig(ADMIN_TAB_ENTRIES);

export function AdminDashboard() {
	const queryClient = useQueryClient();
	const { refetch } = useRealTimeAnalytics();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [refreshGeneration, setRefreshGeneration] = useState(0);

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		try {
			await queryInvalidationService.invalidateAdminDashboardQueries(queryClient);
			await refetch();
		} finally {
			setIsRefreshing(false);
			setRefreshGeneration(g => g + 1);
		}
	}, [queryClient, refetch]);

	return (
		<RefreshAnimationContext.Provider value={refreshGeneration}>
			<DashboardWithTabsLayout
				title='Admin Dashboard'
				description='Manage and monitor platform statistics and users'
				onRefresh={handleRefresh}
				isRefreshing={isRefreshing}
				tabs={TABS_CONFIG}
				defaultTab='performance'
			/>
		</RefreshAnimationContext.Provider>
	);
}
