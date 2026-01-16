import { GamepadIcon, Target, TrendingUp, Trophy } from 'lucide-react';

import { formatForDisplay } from '@shared/utils';

import { StatCardVariant, TextColor } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle, Skeleton, StatCard } from '@/components';
import { useUserStatisticsById } from '@/hooks';
import type { UserStatisticsTabProps } from '@/types';
import { formatPlayTime } from '@/utils';

export function UserStatisticsTab({ activeUserId }: UserStatisticsTabProps) {
	const { data: userStatistics, isLoading: statisticsLoading } = useUserStatisticsById(activeUserId, true);

	if (statisticsLoading) {
		return (
			<div className='space-y-4'>
				{[...Array(4)].map((_, i) => (
					<Skeleton key={i} className='h-24 w-full' />
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
				/>
				<StatCard
					icon={Trophy}
					label='Total Score'
					value={(userStatistics.data.totalScore ?? userStatistics.data.averageScore ?? 0).toLocaleString()}
					color={TextColor.YELLOW_500}
					variant={StatCardVariant.VERTICAL}
				/>
				<StatCard
					icon={Target}
					label='Correct Answers'
					value={userStatistics.data.correctAnswers ?? 0}
					color={TextColor.GREEN_500}
					variant={StatCardVariant.VERTICAL}
				/>
				<StatCard
					icon={TrendingUp}
					label='Success Rate'
					value={`${formatForDisplay(userStatistics.data.successRate ?? 0)}%`}
					color={TextColor.PURPLE_500}
					variant={StatCardVariant.VERTICAL}
				/>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Statistics Details</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='flex justify-between items-center'>
						<span>Total Questions</span>
						<span className='font-medium'>{userStatistics.data.totalQuestionsAnswered ?? 0}</span>
					</div>
					{userStatistics.data.averageTimePerQuestion && (
						<div className='flex justify-between items-center'>
							<span>Average Time Per Question</span>
							<span className='font-medium'>
								{formatPlayTime(userStatistics.data.averageTimePerQuestion, 'seconds')}
							</span>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
