import { Award, BookOpen, Clock } from 'lucide-react';

import { SKELETON_WIDTHS, StatCardVariant, TextColor } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle, Skeleton, StatCard } from '@/components';
import { useUserSummaryById } from '@/hooks';
import type { UserOverviewTabProps } from '@/types';
import { formatDate } from '@/utils';

export function UserOverviewTab({ activeUserId }: UserOverviewTabProps) {
	const { data: userSummary, isLoading: userLoading } = useUserSummaryById(activeUserId, false, true);

	const summaryData = userSummary?.data;

	if (userLoading || !summaryData) {
		return (
			<div className='space-y-6'>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{[...Array(2)].map((_, i) => (
						<Skeleton key={i} className={`h-48 ${SKELETON_WIDTHS.FULL}`} />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				<StatCard
					icon={Clock}
					label='Account Age'
					value={`${Math.round(summaryData.user.accountAge / 365)} days`}
					color={TextColor.PURPLE_500}
					variant={StatCardVariant.VERTICAL}
					isLoading={userLoading}
				/>
				<StatCard
					icon={Award}
					label='Achievements Unlocked'
					value={summaryData.highlights.achievementsUnlocked ?? 0}
					color={TextColor.YELLOW_500}
					variant={StatCardVariant.VERTICAL}
					isLoading={userLoading}
				/>
				<StatCard
					icon={BookOpen}
					label='Top Topics Count'
					value={summaryData.highlights.topTopics?.length ?? 0}
					color={TextColor.BLUE_500}
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
						<div className='flex justify-between items-center'>
							<span className='text-sm text-muted-foreground'>Total Credits</span>
							<span className='text-sm font-medium'>{summaryData.user.totalCredits ?? 0}</span>
						</div>
						<div className='flex justify-between items-center'>
							<span className='text-sm text-muted-foreground'>Account Created</span>
							<span className='text-sm font-medium'>{formatDate(summaryData.user.createdAt)}</span>
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
