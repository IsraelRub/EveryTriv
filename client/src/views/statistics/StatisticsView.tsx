import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { STATISTICS_TAB_PARAM, STATISTICS_TABS, StatisticsKey } from '@/constants';
import { queryInvalidationService } from '@/services';
import { createTabLoader } from '@/utils';
import { DashboardWithTabs } from '@/components';
import { useCurrentUserData, useIsAuthenticated } from '@/hooks';

export function StatisticsView() {
	const { t } = useTranslation('statistics');
	const queryClient = useQueryClient();
	const currentUser = useCurrentUserData();
	const isAuthenticated = useIsAuthenticated();
	const loadModule = useMemo(() => createTabLoader('statistics'), []);

	const onRefresh = useCallback(async () => {
		await queryInvalidationService.invalidateGameQueries(queryClient, currentUser?.id);
	}, [queryClient, currentUser?.id]);

	const filterTabs = useCallback(
		(tab: { value: string }) => tab.value === 'leaderboard' || isAuthenticated,
		[isAuthenticated]
	);

	return (
		<DashboardWithTabs
			specs={STATISTICS_TABS}
			loadModule={loadModule}
			tabParam={STATISTICS_TAB_PARAM}
			i18nNamespace='statistics'
			title={t(StatisticsKey.TITLE)}
			description={isAuthenticated ? t(StatisticsKey.DESCRIPTION_AUTHENTICATED) : t(StatisticsKey.DESCRIPTION_GUEST)}
			onRefresh={onRefresh}
			filterTabs={filterTabs}
			defaultTab={isAuthenticated ? 'performance' : 'leaderboard'}
		/>
	);
}
