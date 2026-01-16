import { GamepadIcon, Target, TrendingUp, Trophy } from 'lucide-react';

import type { UserProgressTopic } from '@shared/types';
import { formatForDisplay } from '@shared/utils';

import { StatCardVariant, TextColor, VariantBase } from '@/constants';
import {
	Badge,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Skeleton,
	StatCard,
	TrendChart,
} from '@/components';
import { useUserProgressById } from '@/hooks';
import type { UserProgressTabProps } from '@/types';

export function UserProgressTab({ activeUserId, trendsPeriod }: UserProgressTabProps) {
	const { data: userProgress, isLoading: progressLoading } = useUserProgressById(
		activeUserId,
		{ groupBy: trendsPeriod, limit: 30 },
		true
	);

	if (progressLoading) {
		return (
			<div className='space-y-4'>
				<Skeleton className='h-96 w-full' />
			</div>
		);
	}

	if (!userProgress?.data) {
		return (
			<Card>
				<CardContent className='p-6 text-center text-muted-foreground'>
					<TrendingUp className='h-12 w-12 mx-auto mb-4 opacity-50' />
					<p>No progress data available</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			<Card>
				<CardHeader>
					<CardTitle>Progress Overview</CardTitle>
					<CardDescription>User progress analytics and trends</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
						<StatCard
							icon={GamepadIcon}
							label='Games Played'
							value={userProgress.data.totals?.gamesPlayed ?? 0}
							color={TextColor.GREEN_500}
							variant={StatCardVariant.VERTICAL}
						/>
						<StatCard
							icon={Target}
							label='Questions Answered'
							value={userProgress.data.totals?.questionsAnswered ?? 0}
							color={TextColor.BLUE_500}
							variant={StatCardVariant.VERTICAL}
						/>
						<StatCard
							icon={Trophy}
							label='Correct Answers'
							value={userProgress.data.totals?.correctAnswers ?? 0}
							color={TextColor.PURPLE_500}
							variant={StatCardVariant.VERTICAL}
						/>
					</div>
				</CardContent>
			</Card>
			{userProgress.data.timeline && userProgress.data.timeline.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Progress Timeline</CardTitle>
					</CardHeader>
					<CardContent>
						<TrendChart data={userProgress.data.timeline} isLoading={false} height={350} showSuccessRate={true} />
					</CardContent>
				</Card>
			)}
			{userProgress.data.topics && userProgress.data.topics.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Topic Progress</CardTitle>
						<CardDescription>Progress breakdown by topic</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-3'>
							{userProgress.data.topics.map((topic: UserProgressTopic, index: number) => (
								<div key={index} className='p-3 border rounded-lg'>
									<div className='flex justify-between items-center mb-2'>
										<span className='font-medium'>{topic.topic}</span>
										<Badge variant={VariantBase.SECONDARY}>{formatForDisplay(topic.successRate)}% success</Badge>
									</div>
									<div className='grid grid-cols-3 gap-4 text-sm text-muted-foreground'>
										<span>Games: {topic.gamesPlayed}</span>
										<span>Questions: {topic.totalQuestionsAnswered}</span>
										<span>Correct: {topic.correctAnswers}</span>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
