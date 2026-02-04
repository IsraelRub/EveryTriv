import { Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

import { TRANSITION_DURATIONS } from '@/constants';
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
	const currentTab = (() => {
		if (isUrlSync) {
			const param = searchParams.get(tabParam) ?? defaultTab ?? firstTabValue;
			const valid = tabs.some(t => t.value === param);
			return valid ? param : defaultTab ?? firstTabValue;
		}
		return defaultTab ?? firstTabValue;
	})();

	const handleTabChange = (value: string) => {
		if (isUrlSync) {
			setSearchParams(prev => {
				const next = new URLSearchParams(prev);
				next.set(tabParam!, value);
				return next;
			});
		}
	};

	return (
		<motion.main
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: TRANSITION_DURATIONS.SMOOTH }}
			className='min-h-0 h-full flex flex-col overflow-hidden w-full'
		>
			<div className='container mx-auto px-4 pt-0 pb-4 md:pb-6 lg:pb-8 min-h-0 flex-1 flex flex-col w-full'>
				<div className='max-w-7xl mx-auto w-full space-y-2 md:space-y-3 min-h-0 flex-1 flex flex-col overflow-hidden'>
					<div className='text-center flex-shrink-0'>
						<h1 className='text-3xl md:text-4xl font-bold mb-0'>{title}</h1>
						<p className='text-sm md:text-base text-muted-foreground'>{description}</p>
						<div className='flex justify-center mt-2'>
							<RefreshButton onClick={onRefresh} isLoading={isRefreshing} />
						</div>
					</div>

					<Tabs
						{...(isUrlSync
							? { value: currentTab, onValueChange: handleTabChange }
							: { defaultValue: currentTab })}
						className='w-full min-h-0 flex-1 flex flex-col overflow-hidden min-w-0'
					>
						<TabsList variant='compact' className='flex-shrink-0'>
							{tabs.map(({ label, value }) => (
								<TabsTrigger key={value} value={value}>
									{label}
								</TabsTrigger>
							))}
						</TabsList>

						{tabs.map(({ value, component: TabComponent }) => (
							<TabsContent
								key={value}
								value={value}
								className='w-full min-w-0 mt-2 md:mt-4 space-y-4 md:space-y-6 lg:space-y-8 min-h-0 flex-1 overflow-y-auto'
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
