import { Clock, GamepadIcon, Target, Trophy } from 'lucide-react';

import { formatForDisplay } from '@shared/utils';

import { StatCardVariant, TextColor } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components';
import { useUserPerformanceById, useUserSummaryById } from '@/hooks';
import type { UserOverviewTabProps } from '@/types';

export function UserOverviewTab({ activeUserId }: UserOverviewTabProps) {
	const { data: userSummary, isLoading: userLoading } = useUserSummaryById(activeUserId, false, true);
	const { data: userPerformance, isLoading: performanceLoading } = useUserPerformanceById(activeUserId, true);

	const summaryData = userSummary?.data;
	const performanceData = userPerformance?.data;

	if (userLoading || !summaryData) {
		return null;
	}

	return (
		<div className='space-y-6'>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
				<StatCard
					icon={GamepadIcon}
					label='Total Games'
					value={summaryData.highlights.totalGames ?? 0}
					color={TextColor.BLUE_500}
					variant={StatCardVariant.VERTICAL}
					isLoading={userLoading}
				/>
				<StatCard
					icon={Trophy}
					label='Best Score'
					value={(summaryData.highlights.bestScore ?? 0).toLocaleString()}
					color={TextColor.YELLOW_500}
					variant={StatCardVariant.VERTICAL}
					isLoading={userLoading}
				/>
				<StatCard
					icon={Target}
					label='Success Rate'
					value={`${formatForDisplay(performanceData?.consistencyScore ?? 0)}%`}
					color={TextColor.GREEN_500}
					variant={StatCardVariant.VERTICAL}
					isLoading={userLoading || performanceLoading}
				/>
				<StatCard
					icon={Clock}
					label='Account Age'
					value={`${Math.round(summaryData.user.accountAge / 365)} days`}
					color={TextColor.PURPLE_500}
					variant={StatCardVariant.VERTICAL}
					isLoading={userLoading}
				/>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				<Card>
					<CardHeader>
						<CardTitle>User Information</CardTitle>
					</CardHeader>
					<CardContent className='space-y-3'>
						<div className='flex justify-between items-center'>
							<span className='text-sm text-muted-foreground'>User ID</span>
							<span className='text-sm font-medium'>{summaryData.user.userId}</span>
						</div>
						<div className='flex justify-between items-center'>
							<span className='text-sm text-muted-foreground'>Email</span>
							<span className='text-sm font-medium'>{summaryData.user.email ?? 'N/A'}</span>
						</div>
						<div className='flex justify-between items-center'>
							<span className='text-sm text-muted-foreground'>Credits</span>
							<span className='text-sm font-medium'>{summaryData.user.credits ?? 0}</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Top Topics</CardTitle>
					</CardHeader>
					<CardContent>
						{summaryData.highlights.topTopics && summaryData.highlights.topTopics.length > 0 ? (
							<div className='space-y-2'>
								{summaryData.highlights.topTopics.slice(0, 5).map((topic, index) => (
									<div key={index} className='flex items-center justify-between'>
										<span className='text-sm'>{topic}</span>
									</div>
								))}
							</div>
						) : (
							<p className='text-sm text-muted-foreground'>No topics data available</p>
						)}
					</CardContent>
				</Card>
			</div>

			{summaryData.insights && summaryData.insights.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Insights</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className='space-y-2'>
							{summaryData.insights.map((insight, index) => (
								<li key={index} className='text-sm flex items-start gap-2'>
									<span className='text-primary mt-1'>•</span>
									<span>{insight}</span>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
