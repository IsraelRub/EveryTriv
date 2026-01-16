import { useState } from 'react';

import { TimePeriod } from '@shared/constants';

import { Tabs, TabsContent, TabsList, TabsTrigger, TrendChart } from '@/components';
import { useUserTrendsById } from '@/hooks';
import type { UserTrendsTabProps } from '@/types';

export function UserTrendsTab({ activeUserId }: UserTrendsTabProps) {
	const [trendsPeriod, setTrendsPeriod] = useState<TimePeriod>(TimePeriod.DAILY);
	const { data: userTrends, isLoading: trendsLoading } = useUserTrendsById(
		activeUserId,
		{ groupBy: trendsPeriod, limit: 30 },
		true
	);

	const trendsData = userTrends?.data;

	return (
		<Tabs
			value={trendsPeriod}
			onValueChange={value => {
				if (value === TimePeriod.DAILY || value === TimePeriod.WEEKLY || value === TimePeriod.MONTHLY) {
					setTrendsPeriod(value);
				}
			}}
			className='w-full'
		>
			<TabsList className='grid w-full grid-cols-3'>
				<TabsTrigger value={TimePeriod.DAILY}>Daily</TabsTrigger>
				<TabsTrigger value={TimePeriod.WEEKLY}>Weekly</TabsTrigger>
				<TabsTrigger value={TimePeriod.MONTHLY}>Monthly</TabsTrigger>
			</TabsList>
			<TabsContent value={trendsPeriod} className='mt-6'>
				<TrendChart data={trendsData} isLoading={trendsLoading} height={400} showSuccessRate={true} />
			</TabsContent>
		</Tabs>
	);
}
