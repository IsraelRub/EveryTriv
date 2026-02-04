import { FileQuestion, GamepadIcon, Target, Timer, TrendingUp, Trophy } from 'lucide-react';

import { formatForDisplay } from '@shared/utils';

import { SKELETON_HEIGHTS, SKELETON_WIDTHS, StatCardVariant, TextColor } from '@/constants';
import { Card, CardContent, Skeleton, StatCard } from '@/components';
import { useUserStatisticsById } from '@/hooks';
import type { UserStatisticsTabProps } from '@/types';
import { formatPlayTime } from '@/utils';

export function UserStatisticsTab({ activeUserId }: UserStatisticsTabProps) {
	const { data: userStatistics, isLoading: statisticsLoading } = useUserStatisticsById(activeUserId, true);

	if (statisticsLoading) {
		return (
			<div className='space-y-4'>
				{[...Array(4)].map((_, i) => (
					<Skeleton key={i} className={`${SKELETON_HEIGHTS.CARD} ${SKELETON_WIDTHS.FULL}`} />
				))}
			</div>
		);
	}

	if (!userStatistics?.data) {
		return (
			<Card>
				<CardContent className='p-6 text-center text-muted-foreground'>
					<p>No statistics available</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
				<StatCard
					icon={GamepadIcon}
					label='Total Games'
					value={userStatistics.data.totalGames ?? 0}
					color={TextColor.BLUE_500}
					variant={StatCardVariant.VERTICAL}
					countUp
				/>
				<StatCard
					icon={Trophy}
					label='Total Score'
					value={userStatistics.data.totalScore ?? userStatistics.data.averageScore ?? 0}
					color={TextColor.YELLOW_500}
					variant={StatCardVariant.VERTICAL}
					countUp
				/>
				<StatCard
					icon={Target}
					label='Correct Answers'
					value={userStatistics.data.correctAnswers ?? 0}
					color={TextColor.GREEN_500}
					variant={StatCardVariant.VERTICAL}
					countUp
				/>
				<StatCard
					icon={TrendingUp}
					label='Success Rate'
					value={`${formatForDisplay(userStatistics.data.successRate ?? 0)}%`}
					color={TextColor.PURPLE_500}
					variant={StatCardVariant.VERTICAL}
				/>
			</div>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<StatCard
					icon={FileQuestion}
					label='Total Questions'
					value={userStatistics.data.totalQuestionsAnswered ?? 0}
					color={TextColor.BLUE_500}
					variant={StatCardVariant.VERTICAL}
					isLoading={statisticsLoading}
					countUp
				/>
				{userStatistics.data.averageTimePerQuestion && (
					<StatCard
						icon={Timer}
						label='Average Time Per Question'
						value={formatPlayTime(userStatistics.data.averageTimePerQuestion, 'seconds')}
						color={TextColor.PURPLE_500}
						variant={StatCardVariant.VERTICAL}
						isLoading={statisticsLoading}
					/>
				)}
			</div>
		</div>
	);
}
