import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { ensureErrorObject } from '@shared/utils';

import { ADMIN_TABS } from '@/constants';
import { DashboardWithTabsLayout } from '@/components';
import { useGlobalStats } from '@/hooks';
import { clientLogger as logger, queryInvalidationService } from '@/services';
import { buildDashboardTabsConfig } from '@/utils';
import { RefreshAnimationContext } from '@/contexts';

const loadAdminTab = async (name: string) => {
	switch (name) {
		case 'AdminPerformanceTab':
			return import('@/views/admin/tabs/AdminPerformanceTab');
		case 'AdminTriviaTab':
			return import('@/views/admin/tabs/AdminTriviaTab');
		case 'AdminUsersTab':
			return import('@/views/admin/tabs/AdminUsersTab');
		case 'AdminBusinessTab':
			return import('@/views/admin/tabs/AdminBusinessTab');
		case 'AdminSystemTab':
			return import('@/views/admin/tabs/AdminSystemTab');
		case 'AdminAiProvidersTab':
			return import('@/views/admin/tabs/AdminAiProvidersTab');
		default:
			throw new Error(`Unknown admin tab: ${name}`);
	}
};

const ADMIN_TABS_CONFIG = buildDashboardTabsConfig(ADMIN_TABS, loadAdminTab);

export function AdminDashboard() {
	const queryClient = useQueryClient();
	const { refetch } = useGlobalStats(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [refreshGeneration, setRefreshGeneration] = useState(0);

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		try {
			await queryInvalidationService.invalidateAdminDashboardQueries(queryClient);
			await refetch();
		} catch (error) {
			const err = ensureErrorObject(error);
			logger.userError('Admin dashboard refresh failed', { errorInfo: { message: err.message } });
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
				tabs={ADMIN_TABS_CONFIG}
				defaultTab='performance'
			/>
		</RefreshAnimationContext.Provider>
	);
}
