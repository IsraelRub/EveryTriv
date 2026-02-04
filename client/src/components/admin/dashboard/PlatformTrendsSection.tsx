import { TrendingUp } from 'lucide-react';

import { TimePeriod } from '@shared/constants';

import { CHART_HEIGHTS } from '@/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, TrendChart } from '@/components';
import { useGlobalTrends } from '@/hooks';
import type { PlatformTrendsSectionProps } from '@/types';

export function PlatformTrendsSection({ statsLoading }: PlatformTrendsSectionProps) {
	const { data: globalTrends, isLoading: trendsLoading } = useGlobalTrends({ groupBy: TimePeriod.DAILY, limit: 30 });
	const isLoading = statsLoading || trendsLoading;

	return (
		<div className='space-y-8'>
			<Card className='border-muted bg-muted/20'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<TrendingUp className='h-5 w-5' />
						Platform Trends
					</CardTitle>
					<CardDescription>Historical trends and performance metrics over time</CardDescription>
				</CardHeader>
				<CardContent>
					<TrendChart
						data={globalTrends}
						isLoading={isLoading}
						height={CHART_HEIGHTS.LARGE}
						showSuccessRate={true}
						className='col-span-full'
					/>
				</CardContent>
			</Card>
		</div>
	);
}
