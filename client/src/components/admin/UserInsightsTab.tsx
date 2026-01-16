import { Award, BarChart3 } from 'lucide-react';

import { VariantBase } from '@/constants';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components';
import { useUserAchievementsById, useUserInsightsById, useUserRecommendationsById } from '@/hooks';
import type { UserInsightsTabProps } from '@/types';

export function UserInsightsTab({ activeUserId }: UserInsightsTabProps) {
	const { data: userInsights, isLoading: insightsLoading } = useUserInsightsById(activeUserId, true);
	const { data: userRecommendations, isLoading: recommendationsLoading } = useUserRecommendationsById(
		activeUserId,
		true
	);
	const { data: userAchievements, isLoading: achievementsLoading } = useUserAchievementsById(activeUserId, true);

	if (insightsLoading || recommendationsLoading || achievementsLoading) {
		return (
			<div className='space-y-4'>
				{[...Array(3)].map((_, i) => (
					<Skeleton key={i} className='h-32 w-full' />
				))}
			</div>
		);
	}

	if (
		!userInsights?.data &&
		(!userRecommendations?.data || userRecommendations.data.length === 0) &&
		(!userAchievements?.data || userAchievements.data.length === 0)
	) {
		return (
			<Card>
				<CardContent className='p-6 text-center text-muted-foreground'>
					<BarChart3 className='h-12 w-12 mx-auto mb-4 opacity-50' />
					<p>No insights, recommendations, or achievements available</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			{userInsights?.data && (
				<Card>
					<CardHeader>
						<CardTitle>User Insights</CardTitle>
						<CardDescription>Detailed analytics and insights about the user</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						{userInsights.data.strengths && userInsights.data.strengths.length > 0 && (
							<div>
								<h4 className='font-medium mb-2'>Strengths</h4>
								<ul className='space-y-1'>
									{userInsights.data.strengths.map((strength: string, index: number) => (
										<li key={index} className='flex items-start gap-2 text-sm'>
											<span className='text-green-500 mt-1'>✓</span>
											<span>{strength}</span>
										</li>
									))}
								</ul>
							</div>
						)}
						{userInsights.data.improvements && userInsights.data.improvements.length > 0 && (
							<div>
								<h4 className='font-medium mb-2'>Areas for Improvement</h4>
								<ul className='space-y-1'>
									{userInsights.data.improvements.map((improvement: string, index: number) => (
										<li key={index} className='flex items-start gap-2 text-sm'>
											<span className='text-yellow-500 mt-1'>!</span>
											<span>{improvement}</span>
										</li>
									))}
								</ul>
							</div>
						)}
						{userInsights.data.recentHighlights && userInsights.data.recentHighlights.length > 0 && (
							<div>
								<h4 className='font-medium mb-2'>Recent Highlights</h4>
								<ul className='space-y-1'>
									{userInsights.data.recentHighlights.map((highlight: string, index: number) => (
										<li key={index} className='flex items-start gap-2 text-sm'>
											<span className='text-blue-500 mt-1'>•</span>
											<span>{highlight}</span>
										</li>
									))}
								</ul>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{userRecommendations?.data && userRecommendations.data.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Recommendations</CardTitle>
						<CardDescription>Personalized recommendations for the user</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-4'>
							{userRecommendations.data.map(recommendation => (
								<Card key={recommendation.id} className='border-l-4 border-l-blue-500'>
									<CardHeader className='pb-3'>
										<div className='flex items-start justify-between'>
											<div className='flex-1'>
												<CardTitle className='text-lg mb-1'>{recommendation.title}</CardTitle>
												<CardDescription>{recommendation.description}</CardDescription>
											</div>
											<Badge
												variant={recommendation.priority === 'high' ? VariantBase.DESTRUCTIVE : VariantBase.SECONDARY}
											>
												{recommendation.priority}
											</Badge>
										</div>
									</CardHeader>
									<CardContent>
										<p className='text-sm mb-2'>{recommendation.message}</p>
										<div className='flex flex-wrap gap-4 text-xs text-muted-foreground'>
											<span>
												<strong>Action:</strong> {recommendation.action}
											</span>
											<span>
												<strong>Impact:</strong> {recommendation.estimatedImpact}
											</span>
											<span>
												<strong>Effort:</strong> {recommendation.implementationEffort}
											</span>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{userAchievements?.data && userAchievements.data.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Achievements</CardTitle>
						<CardDescription>User achievements and milestones</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							{userAchievements.data.map(achievement => (
								<Card key={achievement.id} className='border-l-4 border-l-yellow-500'>
									<CardHeader className='pb-3'>
										<CardTitle className='text-base flex items-center gap-2'>
											<Award className='h-4 w-4 text-yellow-500' />
											{achievement.name}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className='text-sm text-muted-foreground'>{achievement.description}</p>
										{achievement.unlockedAt && (
											<p className='text-xs text-muted-foreground mt-2'>
												Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
											</p>
										)}
									</CardContent>
								</Card>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
