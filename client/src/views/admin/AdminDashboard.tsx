import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { ADMIN_TAB_PARAM, ADMIN_TABS, AdminKey, DashboardTabBundle } from '@/constants';
import { queryInvalidationService } from '@/services';
import { createTabLoader } from '@/utils';
import { DashboardWithTabs } from '@/components';
import { useGlobalStats } from '@/hooks';

export function AdminDashboard() {
	const { t } = useTranslation('admin');
	const queryClient = useQueryClient();
	const { refetch } = useGlobalStats(true);
	const loadModule = useMemo(() => createTabLoader(DashboardTabBundle.ADMIN), []);

	const onRefresh = useCallback(async () => {
		await queryInvalidationService.invalidateAdminDashboardQueries(queryClient);
		await refetch();
	}, [queryClient, refetch]);

	return (
		<DashboardWithTabs
			specs={ADMIN_TABS}
			loadModule={loadModule}
			tabParam={ADMIN_TAB_PARAM}
			i18nNamespace='admin'
			title={t(AdminKey.TITLE)}
			description={t(AdminKey.DESCRIPTION)}
			onRefresh={onRefresh}
			defaultTab='performance'
		/>
	);
}
