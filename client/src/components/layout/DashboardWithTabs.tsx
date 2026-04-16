import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import { Locale } from '@shared/constants';
import { ensureErrorObject } from '@shared/utils';

import { SKELETON_PLACEHOLDER_COUNTS, SkeletonVariant, TabsListVariant, TRANSITION_DURATIONS } from '@/constants';
import type { DashboardWithTabsProps } from '@/types';
import { clientLogger as logger } from '@/services';
import { buildDashboardTabsConfig } from '@/utils';
import { RefreshButton, Skeleton, Tabs, TabsBar, TabsContent } from '@/components';
import { useAppSelector } from '@/hooks';
import { selectLocale } from '@/redux/selectors';
import { RefreshAnimationContext } from '@/contexts';

export function DashboardWithTabs({
	specs,
	loadModule,
	tabParam,
	i18nNamespace,
	title,
	description,
	onRefresh,
	filterTabs,
	defaultTab: defaultTabProp,
	suspenseFallback,
}: DashboardWithTabsProps) {
	const { t } = useTranslation(i18nNamespace);
	const locale = useAppSelector(selectLocale);
	const shellDir = locale === Locale.HE ? 'rtl' : 'ltr';
	const [searchParams, setSearchParams] = useSearchParams();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [refreshGeneration, setRefreshGeneration] = useState(0);

	const tabs = useMemo(() => {
		const base = buildDashboardTabsConfig(specs, loadModule).map(tab => ({
			...tab,
			label: t(`tab_${tab.label.toLowerCase().replace(/\s+/g, '_')}`),
		}));
		const filtered = filterTabs ? base.filter(filterTabs) : base;
		return filtered;
	}, [specs, loadModule, t, filterTabs]);

	const firstTabValue = tabs[0]?.value ?? '';
	const defaultTab = defaultTabProp ?? firstTabValue;
	const isUrlSync = tabParam !== undefined;

	const currentTab = (() => {
		if (isUrlSync) {
			const param = searchParams.get(tabParam) ?? defaultTab ?? firstTabValue;
			return tabs.some(tab => tab.value === param) ? param : (defaultTab ?? firstTabValue);
		}
		return defaultTab ?? firstTabValue;
	})();

	useEffect(() => {
		if (!isUrlSync || !tabParam) return;
		const param = searchParams.get(tabParam);
		const resolved = defaultTab ?? firstTabValue;
		const valid = param != null && tabs.some(tab => tab.value === param);
		if (!valid) {
			setSearchParams(
				prev => {
					const next = new URLSearchParams(prev);
					next.set(tabParam, resolved);
					return next;
				},
				{ replace: true }
			);
		}
	}, [isUrlSync, tabParam, defaultTab, firstTabValue, tabs, searchParams, setSearchParams]);

	const handleTabChange = useCallback(
		(value: string) => {
			if (isUrlSync) {
				setSearchParams(prev => {
					const next = new URLSearchParams(prev);
					next.set(tabParam, value);
					return next;
				});
			}
		},
		[isUrlSync, tabParam, setSearchParams]
	);

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		try {
			await onRefresh();
		} catch (error) {
			const err = ensureErrorObject(error);
			logger.userError('Dashboard refresh failed', { errorInfo: { message: err.message } });
		} finally {
			setIsRefreshing(false);
			setRefreshGeneration(g => g + 1);
		}
	}, [onRefresh]);

	return (
		<RefreshAnimationContext.Provider value={refreshGeneration}>
			<motion.main
				dir={shellDir}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: TRANSITION_DURATIONS.SMOOTH }}
				className='view-main-fill w-full'
			>
				<div className='view-container-inner lg:pb-8 w-full'>
					<div className='view-centered-7xl w-full space-y-2 md:space-y-3 min-h-0 flex-1 flex flex-col overflow-hidden'>
						<div className='text-center flex-shrink-0'>
							<h1 className='text-3xl md:text-4xl font-bold mb-0'>{title}</h1>
							<p className='text-sm md:text-base text-muted-foreground'>{description}</p>
							<div className='flex justify-center mt-2'>
								<RefreshButton onClick={handleRefresh} isLoading={isRefreshing} />
							</div>
						</div>

						<Tabs
							{...(isUrlSync ? { value: currentTab, onValueChange: handleTabChange } : { defaultValue: currentTab })}
							className='w-full min-h-0 flex-1 flex flex-col overflow-hidden min-w-0'
						>
							{tabs.length > 1 && (
								<TabsBar items={tabs.map(({ value, label }) => ({ value, label }))} variant={TabsListVariant.COMPACT} />
							)}

							{tabs.map(({ value, component: TabComponent }) => (
								<TabsContent
									key={value}
									value={value}
									className='w-full min-w-0 mt-2 md:mt-4 min-h-0 flex-1 overflow-y-auto view-spacing-lg'
								>
									<Suspense
										fallback={
											suspenseFallback ?? (
												<div className='space-y-8'>
													<div className='grid grid-cols-4 gap-4'>
														<Skeleton variant={SkeletonVariant.Card} count={SKELETON_PLACEHOLDER_COUNTS.CARDS} />
													</div>
												</div>
											)
										}
									>
										<TabComponent />
									</Suspense>
								</TabsContent>
							))}
						</Tabs>
					</div>
				</div>
			</motion.main>
		</RefreshAnimationContext.Provider>
	);
}
