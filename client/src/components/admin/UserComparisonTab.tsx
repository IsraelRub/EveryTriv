import { Flame, GamepadIcon, Target, Trophy } from 'lucide-react';

import { ComparisonTarget } from '@shared/constants';
import { formatForDisplay } from '@shared/utils';

import { StatCardVariant, TextColor, VariantBase } from '@/constants';
import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton, StatCard } from '@/components';
import { useGlobalStats, useUserComparisonById } from '@/hooks';
import type { UserComparisonTabProps } from '@/types';

export function UserComparisonTab({ activeUserId }: UserComparisonTabProps) {
	const { data: userComparison, isLoading: comparisonLoading } = useUserComparisonById(
		activeUserId,
		{ target: ComparisonTarget.GLOBAL },
		true
	);
	const { data: globalStats } = useGlobalStats();

	const comparisonData = userComparison?.data;

	if (comparisonLoading) {
		return (
			<div className='space-y-4'>
				{[...Array(4)].map((_, i) => (
					<Skeleton key={i} className='h-24 w-full' />
				))}
			</div>
		);
	}

	if (!comparisonData || !globalStats) {
		return (
			<Card>
				<CardContent className='p-6 text-center text-muted-foreground'>
					<p>No comparison data available</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
				<StatCard
					icon={Target}
					label='Success Rate'
					value={`${formatForDisplay(comparisonData.userMetrics.successRate ?? 0)}%`}
					subtext={`Global: ${formatForDisplay(globalStats.successRate ?? 0)}%`}
					trend={`${formatForDisplay((comparisonData.differences.successRate ?? 0) * 100, 2)}%`}
					trendUp={(comparisonData.differences.successRate ?? 0) > 0}
					color={TextColor.BLUE_500}
					variant={StatCardVariant.VERTICAL}
					isLoading={comparisonLoading}
				/>
				<StatCard
					icon={Trophy}
					label='Average Score'
					value={formatForDisplay(comparisonData.userMetrics.averageScore ?? 0)}
					subtext={`Global: ${formatForDisplay(comparisonData.targetMetrics.averageScore ?? 0)}`}
					trend={`${formatForDisplay((comparisonData.differences.averageScore ?? 0) * 100, 2)}`}
					trendUp={(comparisonData.differences.averageScore ?? 0) > 0}
					color={TextColor.YELLOW_500}
					variant={StatCardVariant.VERTICAL}
					isLoading={comparisonLoading}
				/>
				<StatCard
					icon={GamepadIcon}
					label='Total Games'
					value={(comparisonData.userMetrics.totalGames ?? 0).toLocaleString()}
					subtext={`Global: ${(comparisonData.targetMetrics.totalGames ?? 0).toLocaleString()}`}
					trend={`${formatForDisplay((comparisonData.differences.totalGames ?? 0) * 100, 2)}`}
					trendUp={(comparisonData.differences.totalGames ?? 0) > 0}
					color={TextColor.GREEN_500}
					variant={StatCardVariant.VERTICAL}
					isLoading={comparisonLoading}
				/>
				<StatCard
					icon={Flame}
					label='Streak Days'
					value={`${comparisonData.userMetrics.streakDays ?? 0}`}
					subtext={`Global: ${comparisonData.targetMetrics.streakDays ?? 0}`}
					trend={`${formatForDisplay(comparisonData.differences.streakDays ?? 0, 2)}`}
					trendUp={(comparisonData.differences.streakDays ?? 0) > 0}
					color={TextColor.ORANGE_500}
					variant={StatCardVariant.VERTICAL}
					isLoading={comparisonLoading}
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Comparison Details</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					{comparisonData.userMetrics.rank && (
						<div className='flex justify-between items-center'>
							<span>Global Rank</span>
							<Badge variant={VariantBase.DEFAULT}>#{comparisonData.userMetrics.rank}</Badge>
						</div>
					)}
					{comparisonData.userMetrics.percentile !== undefined && (
						<div className='flex justify-between items-center'>
							<span>Percentile</span>
							<span className='font-medium'>Top {formatForDisplay(comparisonData.userMetrics.percentile)}%</span>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
