import { Activity, Award, Flame, TrendingUp } from 'lucide-react';

import { formatForDisplay } from '@shared/utils';

import { StatCardVariant, TextColor, VariantBase } from '@/constants';
import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton, StatCard } from '@/components';
import { useUserPerformanceById } from '@/hooks';
import type { UserPerformanceTabProps } from '@/types';
import { formatPlayTime } from '@/utils';

export function UserPerformanceTab({ activeUserId }: UserPerformanceTabProps) {
	const { data: userPerformance, isLoading: performanceLoading } = useUserPerformanceById(activeUserId, true);

	if (performanceLoading) {
		return (
			<div className='space-y-4'>
				{[...Array(4)].map((_, i) => (
					<Skeleton key={i} className='h-24 w-full' />
				))}
			</div>
		);
	}

	if (!userPerformance?.data) {
		return (
			<Card>
				<CardContent className='p-6 text-center text-muted-foreground'>
					<p>No performance data available</p>
				</CardContent>
			</Card>
		);
	}

	const performanceData = userPerformance.data;

	return (
		<div className='space-y-6'>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
				<StatCard
					icon={Flame}
					label='Current Streak'
					value={`${performanceData.streakDays ?? 0} days`}
					color={TextColor.ORANGE_500}
					variant={StatCardVariant.VERTICAL}
					isLoading={performanceLoading}
				/>
				<StatCard
					icon={Award}
					label='Best Streak'
					value={`${performanceData.bestStreak ?? 0} days`}
					color={TextColor.YELLOW_500}
					variant={StatCardVariant.VERTICAL}
					isLoading={performanceLoading}
				/>
				<StatCard
					icon={TrendingUp}
					label='Improvement Rate'
					value={`${formatForDisplay(performanceData.improvementRate ?? 0)}%`}
					color={TextColor.GREEN_500}
					variant={StatCardVariant.VERTICAL}
					isLoading={performanceLoading}
				/>
				<StatCard
					icon={Activity}
					label='Consistency'
					value={`${formatForDisplay(performanceData.consistencyScore ?? 0)}%`}
					color={TextColor.BLUE_500}
					variant={StatCardVariant.VERTICAL}
					isLoading={performanceLoading}
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Performance Details</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='flex justify-between items-center'>
						<span>Strongest Topic</span>
						<Badge variant={VariantBase.DEFAULT}>{performanceData.strongestTopic ?? 'N/A'}</Badge>
					</div>
					<div className='flex justify-between items-center'>
						<span>Weakest Topic</span>
						<Badge variant={VariantBase.SECONDARY}>{performanceData.weakestTopic ?? 'N/A'}</Badge>
					</div>
					{performanceData.averageGameTime && (
						<div className='flex justify-between items-center'>
							<span>Average Game Time</span>
							<span className='font-medium'>{formatPlayTime(performanceData.averageGameTime, 'seconds')}</span>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
