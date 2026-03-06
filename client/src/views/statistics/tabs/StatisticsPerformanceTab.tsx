import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
	Brain,
	CalendarDays,
	GamepadIcon,
	GraduationCap,
	Hash,
	Medal,
	Percent,
	Timer,
	TrendingDown,
	TrendingUp,
} from 'lucide-react';

import { ComparisonTarget, TIME_PERIODS_MS } from '@shared/constants';
import { formatNumericValue } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { AchievementCardVariant, AchievementsDescriptionKind, CHART_HEIGHTS, Colors, QUERY_KEYS } from '@/constants';
import {
	AchievementsSection,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CategoryAnalysis,
	EmptyState,
	PerformanceAnalysis,
	StatCard,
	TrendChart,
} from '@/components';
import { useCurrentUserData, useUnifiedUserAnalytics, useUserAnalytics } from '@/hooks';
import { analyticsService } from '@/services';
import { buildAchievementContext, buildDisplayAchievements, cn, formatPlayTime } from '@/utils';

export function StatisticsPerformanceTab() {
	const currentUser = useCurrentUserData();
	const { data: analytics, isLoading: analyticsLoading } = useUserAnalytics();
	const { data: unifiedData } = useUnifiedUserAnalytics(['achievements', 'statistics', 'performance']);

	const context = useMemo(
		() => buildAchievementContext(unifiedData?.data?.statistics, unifiedData?.data?.performance),
		[unifiedData?.data?.statistics, unifiedData?.data?.performance]
	);
	const achievements = useMemo(
		() => buildDisplayAchievements(unifiedData?.data?.achievements ?? [], context),
		[unifiedData?.data?.achievements, context]
	);

	const gameStats = analytics?.game;
	const userDifficultyData = gameStats?.difficultyBreakdown
		? {
				difficulties: gameStats.difficultyBreakdown,
			}
		: undefined;

	// Fetch comparison data
	const { data: comparisonData } = useQuery({
		queryKey: [...QUERY_KEYS.analytics.all, 'comparison', currentUser?.id ?? ''],
		queryFn: async () => {
			if (!currentUser?.id) return null;
			try {
				return await analyticsService.compareUserPerformanceById(currentUser.id, {
					target: ComparisonTarget.GLOBAL,
				});
			} catch {
				return null;
			}
		},
		enabled: !!currentUser?.id,
		staleTime: TIME_PERIODS_MS.FIFTEEN_MINUTES,
		gcTime: TIME_PERIODS_MS.THIRTY_MINUTES,
		retry: false,
	});

	// Process comparison data
	const processedComparison = useMemo(() => {
		if (!comparisonData?.data) {
			return null;
		}

		const comparison = comparisonData.data;
		return {
			userMetrics: comparison.userMetrics,
			targetMetrics: comparison.targetMetrics,
			differences: comparison.differences,
		};
	}, [comparisonData?.data]);

	const userTopicsData = useMemo(() => {
		if (!gameStats?.topicsPlayed) return undefined;
		return {
			topics: Object.entries(gameStats.topicsPlayed)
				.map(([topic, count]) => ({
					topic,
					totalGames: VALIDATORS.number(count) ? count : 0,
				}))
				.filter(t => t.totalGames > 0)
				.sort((a, b) => b.totalGames - a.totalGames),
		};
	}, [gameStats?.topicsPlayed]);

	const achievementsByPoints = useMemo(() => {
		if (achievements.length === 0) return [];
		return [...achievements].sort((a, b) => b.points - a.points);
	}, [achievements]);

	const performanceStats = analytics?.performance;

	if (!analyticsLoading && (gameStats?.totalGames ?? 0) === 0) {
		return (
			<Card>
				<CardContent className='p-6'>
					<EmptyState
						data='performance statistics'
						icon={TrendingUp}
						description='Start playing trivia games to see your performance stats, achievements, and trends here!'
					/>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-8'>
			{/* Key Stats */}
			<Card className='card-muted-tint'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Brain className='h-5 w-5 text-primary' />
						Your Stats at a Glance
					</CardTitle>
					<CardDescription>Core performance metrics</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
						<StatCard
							icon={GamepadIcon}
							label='Total Games'
							value={gameStats?.totalGames ?? 0}
							color={Colors.BLUE_500.text}
							isLoading={analyticsLoading}
						/>
						<StatCard
							icon={Medal}
							label='Best Score'
							value={gameStats?.bestScore ?? 0}
							color={Colors.YELLOW_500.text}
							isLoading={analyticsLoading}
						/>
						<StatCard
							icon={Timer}
							label='Total Play Time'
							value={formatPlayTime(gameStats?.totalPlayTime ?? 0, 'seconds')}
							color={Colors.PURPLE_500.text}
							isLoading={analyticsLoading}
						/>
						<StatCard
							icon={CalendarDays}
							label='Current Streak'
							value={formatNumericValue(performanceStats?.streakDays, 0, ' days')}
							color={Colors.GREEN_500.text}
							isLoading={analyticsLoading}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Achievements */}
			{achievements.length > 0 && (
				<AchievementsSection
					cardClassName='card-muted-tint'
					achievements={achievementsByPoints}
					variant={AchievementCardVariant.COMPACT}
					descriptionKind={AchievementsDescriptionKind.YOUR}
					emptyMessage='No achievements yet'
					emptyIcon={GraduationCap}
					titleIcon={GraduationCap}
				/>
			)}

			{/* Comparison View – only when we have valid user and target metrics */}
			{processedComparison?.userMetrics != null && processedComparison?.targetMetrics != null && (
				<Card className='card-muted-tint'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<TrendingUp className='h-5 w-5 text-primary' />
							Comparison with Global Average
						</CardTitle>
						<CardDescription>See how you perform compared to other players</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							{/* Success Rate Comparison */}
							<div className='space-y-4'>
								<h4 className='text-sm font-medium text-muted-foreground mb-3'>Success Rate</h4>
								<div className='space-y-3'>
									<div className='flex justify-between items-center p-3 rounded-lg bg-primary/5'>
										<span>Your Average</span>
										<span className='font-bold'>
											{formatNumericValue(processedComparison.userMetrics?.successRate, 1, '%')}
										</span>
									</div>
									<div className='flex justify-between items-center p-3 rounded-lg bg-muted/50'>
										<span>Global Average</span>
										<span className='font-bold'>
											{formatNumericValue(processedComparison.targetMetrics?.successRate, 1, '%')}
										</span>
									</div>
									<div
										className={cn(
											'flex justify-between items-center p-3 rounded-lg border',
											(processedComparison.differences?.successRate ?? 0) > 0
												? `${Colors.GREEN_500.bg}/10 ${Colors.GREEN_500.border}/30`
												: `${Colors.RED_500.bg}/10 ${Colors.RED_500.border}/30`
										)}
									>
										<span>Difference</span>
										<div className='flex items-center gap-2'>
											{(processedComparison.differences?.successRate ?? 0) > 0 ? (
												<TrendingUp className={cn('h-4 w-4', Colors.GREEN_500.text)} />
											) : (
												<TrendingDown className={cn('h-4 w-4', Colors.RED_500.text)} />
											)}
											<span
												className={cn(
													'font-bold',
													(processedComparison.differences?.successRate ?? 0) > 0
														? Colors.GREEN_500.text
														: Colors.RED_500.text
												)}
											>
												{formatNumericValue(
													processedComparison.differences?.successRate,
													1,
													'%',
													(processedComparison.differences?.successRate ?? 0) > 0 ? '+' : ''
												)}
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Average Score Comparison */}
							<div className='space-y-4'>
								<h4 className='text-sm font-medium text-muted-foreground mb-3'>Average Score</h4>
								<div className='space-y-3'>
									<div className='flex justify-between items-center p-3 rounded-lg bg-primary/5'>
										<span>Your Average</span>
										<span className='font-bold'>
											{formatNumericValue(processedComparison.userMetrics?.averageScore, 0)}
										</span>
									</div>
									<div className='flex justify-between items-center p-3 rounded-lg bg-muted/50'>
										<span>Global Average</span>
										<span className='font-bold'>
											{formatNumericValue(processedComparison.targetMetrics?.averageScore, 0)}
										</span>
									</div>
									<div
										className={cn(
											'flex justify-between items-center p-3 rounded-lg border',
											(processedComparison.differences?.averageScore ?? 0) > 0
												? `${Colors.GREEN_500.bg}/10 ${Colors.GREEN_500.border}/30`
												: `${Colors.RED_500.bg}/10 ${Colors.RED_500.border}/30`
										)}
									>
										<span>Difference</span>
										<div className='flex items-center gap-2'>
											{(processedComparison.differences?.averageScore ?? 0) > 0 ? (
												<TrendingUp className={cn('h-4 w-4', Colors.GREEN_500.text)} />
											) : (
												<TrendingDown className={cn('h-4 w-4', Colors.RED_500.text)} />
											)}
											<span
												className={cn(
													'font-bold',
													(processedComparison.differences?.averageScore ?? 0) > 0
														? Colors.GREEN_500.text
														: Colors.RED_500.text
												)}
											>
												{formatNumericValue(
													processedComparison.differences?.averageScore,
													0,
													' points',
													(processedComparison.differences?.averageScore ?? 0) > 0 ? '+' : ''
												)}
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Rank & Percentile */}
							{processedComparison.userMetrics?.rank != null && processedComparison.userMetrics?.percentile != null && (
								<div className='space-y-4 md:col-span-2'>
									<h4 className='text-sm font-medium text-muted-foreground mb-3'>Ranking</h4>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										<StatCard
											icon={Hash}
											label='Your Rank'
											value={`#${processedComparison.userMetrics.rank}`}
											color={Colors.BLUE_500.text}
											isLoading={analyticsLoading}
										/>
										<StatCard
											icon={Percent}
											label='Percentile'
											value={formatNumericValue(processedComparison.userMetrics?.percentile, 1, '%')}
											subtext={`Better than ${formatNumericValue(processedComparison.userMetrics?.percentile, 1, '%')} of players`}
											color={Colors.PURPLE_500.text}
											isLoading={analyticsLoading}
										/>
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Performance Trends Over Time (own row above) */}
			{analytics?.trends && analytics.trends.length > 0 && (
				<Card className='card-muted-tint'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<TrendingUp className='h-5 w-5 text-primary' />
							Performance Trends Over Time
						</CardTitle>
						<CardDescription>Your score and success rate trends over time</CardDescription>
					</CardHeader>
					<CardContent>
						<TrendChart data={analytics.trends} isLoading={analyticsLoading} height={CHART_HEIGHTS.LARGE} hideCard />
					</CardContent>
				</Card>
			)}

			{/* Your Performance by Difficulty + Your Topics (same row on large screens) */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
				<PerformanceAnalysis
					mainData={userDifficultyData?.difficulties}
					isLoading={analyticsLoading}
					showPersonalStats
				/>
				<CategoryAnalysis topicsData={userTopicsData?.topics ?? []} isLoading={analyticsLoading} showPersonalStats />
			</div>
		</div>
	);
}
