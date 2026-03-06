import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import { TabsListVariant, TRANSITION_DURATIONS } from '@/constants';
import { RefreshButton, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components';
import type { DashboardWithTabsLayoutProps } from '@/types';

export function DashboardWithTabsLayout({
	title,
	description,
	onRefresh,
	isRefreshing,
	tabs,
	defaultTab,
	tabParam,
	suspenseFallback = null,
}: DashboardWithTabsLayoutProps) {
	const [searchParams, setSearchParams] = useSearchParams();
	const firstTabValue = tabs[0]?.value ?? '';
	const isUrlSync = tabParam !== undefined;

	let currentTab: string;
	if (isUrlSync) {
		const param = searchParams.get(tabParam) ?? defaultTab ?? firstTabValue;
		currentTab = tabs.some(t => t.value === param) ? param : (defaultTab ?? firstTabValue);
	} else {
		currentTab = defaultTab ?? firstTabValue;
	}

	useEffect(() => {
		if (!isUrlSync || !tabParam) return;
		const param = searchParams.get(tabParam);
		const resolved = defaultTab ?? firstTabValue;
		const valid = param != null && tabs.some(t => t.value === param);
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

	const handleTabChange = (value: string) => {
		if (isUrlSync) {
			setSearchParams(prev => {
				const next = new URLSearchParams(prev);
				next.set(tabParam, value);
				return next;
			});
		}
	};

	return (
		<motion.main
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
							<RefreshButton onClick={onRefresh} isLoading={isRefreshing} />
						</div>
					</div>

					<Tabs
						{...(isUrlSync ? { value: currentTab, onValueChange: handleTabChange } : { defaultValue: currentTab })}
						className='w-full min-h-0 flex-1 flex flex-col overflow-hidden min-w-0'
					>
						{tabs.length > 1 && (
							<TabsList variant={TabsListVariant.COMPACT} className='flex-shrink-0'>
								{tabs.map(({ label, value }) => (
									<TabsTrigger key={value} value={value}>
										{label}
									</TabsTrigger>
								))}
							</TabsList>
						)}

						{tabs.map(({ value, component: TabComponent }) => (
							<TabsContent
								key={value}
								value={value}
								className='w-full min-w-0 mt-2 md:mt-4 min-h-0 flex-1 overflow-y-auto view-spacing-lg'
							>
								<Suspense fallback={suspenseFallback}>
									<TabComponent />
								</Suspense>
							</TabsContent>
						))}
					</Tabs>
				</div>
			</div>
		</motion.main>
	);
}
