import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
	ArrowUpDown,
	Filter,
	Flame,
	GamepadIcon,
	Hash,
	Percent,
	Target,
	Timer,
	Trophy,
	TrendingDown,
	TrendingUp,
} from 'lucide-react';

import { AchievementSortBy, ComparisonTarget, TIME_PERIODS_MS, VALIDATORS, VALID_ACHIEVEMENT_CATEGORIES } from '@shared/constants';

import { AchievementCardVariant, BgColor, ButtonSize, ButtonVariant, CHART_HEIGHTS, QUERY_KEYS, VariantBase } from '@/constants';
import {
	AchievementCard,
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CategoryAnalysis,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	PerformanceAnalysis,
	StatCard,
	TrendChart,
} from '@/components';
import { useCurrentUserData, useUnifiedUserAnalytics, useUserAnalytics } from '@/hooks';
import { analyticsService } from '@/services';
import { formatPlayTime } from '@/utils';
import { calculateTotalAchievementPoints } from '@/utils/domain/achievement-icons.utils';

export function StatisticsPerformanceTab() {
	const currentUser = useCurrentUserData();
	const { data: analytics, isLoading: analyticsLoading } = useUserAnalytics();
	const { data: unifiedData } = useUnifiedUserAnalytics(['achievements']);

	const achievements = unifiedData?.data?.achievements;
	const [selectedCategories, setSelectedCategories] = useState<Set<string>>(VALID_ACHIEVEMENT_CATEGORIES);
	const [sortBy, setSortBy] = useState<AchievementSortBy>(AchievementSortBy.POINTS);

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

	const filteredAndSortedAchievements = useMemo(() => {
		if (!achievements || achievements.length === 0) return null;
		const filtered = achievements.filter(a => selectedCategories.has(a.category));
		const sorted = [...filtered].sort((a, b) => {
			switch (sortBy) {
				case AchievementSortBy.POINTS:
					return b.points - a.points;
				case AchievementSortBy.NAME:
					return a.name.localeCompare(b.name);
				case AchievementSortBy.CATEGORY:
					return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
				default:
					return 0;
			}
		});
		return sorted;
	}, [achievements, selectedCategories, sortBy]);

	const totalAchievementPoints = useMemo(
		() => calculateTotalAchievementPoints(filteredAndSortedAchievements),
		[filteredAndSortedAchievements],
	);

	const availableCategories = useMemo(() => {
		if (!achievements || achievements.length === 0) return [];
		return Array.from(new Set(achievements.map(a => a.category))).sort();
	}, [achievements]);

	const toggleCategory = (category: string) => {
		setSelectedCategories(prev => {
			const next = new Set(prev);
			if (next.has(category)) next.delete(category);
			else next.add(category);
			return next;
		});
	};

	const performanceStats = analytics?.performance;

	return (
		<div className='space-y-8'>
			{/* Key Stats */}
			<Card className='border-muted bg-muted/20'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Target className='h-5 w-5' />
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
							color={BgColor.BLUE_500}
							countUp
							isLoading={analyticsLoading}
						/>
						<StatCard
							icon={Trophy}
							label='Best Score'
							value={gameStats?.bestScore ?? 0}
							color={BgColor.YELLOW_500}
							countUp
							isLoading={analyticsLoading}
						/>
						<StatCard
							icon={Timer}
							label='Total Play Time'
							value={formatPlayTime(gameStats?.totalPlayTime ?? 0, 'seconds')}
							color={BgColor.PURPLE_500}
							isLoading={analyticsLoading}
						/>
						<StatCard
							icon={Flame}
							label='Current Streak'
							value={`${performanceStats?.streakDays ?? 0} days`}
							color={BgColor.GREEN_500}
							isLoading={analyticsLoading}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Achievements */}
			{achievements && achievements.length > 0 && (
				<Card className='border-muted bg-muted/20'>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<div>
								<CardTitle className='flex items-center gap-2'>
									<Trophy className='h-5 w-5' />
									Achievements
								</CardTitle>
								<CardDescription>
									Your achievements and milestones • Total Points:{' '}
									<span className='font-semibold text-primary'>{totalAchievementPoints}</span>
								</CardDescription>
							</div>
							<div className='flex items-center gap-2'>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant={ButtonVariant.OUTLINE} size={ButtonSize.SM} className='gap-2'>
											<Filter className='h-4 w-4' />
											Filter
											{selectedCategories.size < availableCategories.length && (
												<Badge variant={VariantBase.SECONDARY} className='ml-1'>
													{selectedCategories.size}
												</Badge>
											)}
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end' className='w-48'>
										<DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
										<DropdownMenuSeparator />
										{availableCategories.map(category => (
											<DropdownMenuCheckboxItem
												key={category}
												checked={selectedCategories.has(category)}
												onCheckedChange={() => toggleCategory(category)}
											>
												{category}
											</DropdownMenuCheckboxItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant={ButtonVariant.OUTLINE} size={ButtonSize.SM} className='gap-2'>
											<ArrowUpDown className='h-4 w-4' />
											Sort
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end' className='w-48'>
										<DropdownMenuLabel>Sort by</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuCheckboxItem
											checked={sortBy === AchievementSortBy.POINTS}
											onCheckedChange={() => setSortBy(AchievementSortBy.POINTS)}
										>
											Points (High to Low)
										</DropdownMenuCheckboxItem>
										<DropdownMenuCheckboxItem
											checked={sortBy === AchievementSortBy.NAME}
											onCheckedChange={() => setSortBy(AchievementSortBy.NAME)}
										>
											Name (A-Z)
										</DropdownMenuCheckboxItem>
										<DropdownMenuCheckboxItem
											checked={sortBy === AchievementSortBy.CATEGORY}
											onCheckedChange={() => setSortBy(AchievementSortBy.CATEGORY)}
										>
											Category
										</DropdownMenuCheckboxItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{filteredAndSortedAchievements && filteredAndSortedAchievements.length > 0 ? (
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
								{filteredAndSortedAchievements.map(achievement => (
									<AchievementCard
										key={achievement.id}
										achievement={achievement}
										variant={AchievementCardVariant.COMPACT}
									/>
								))}
							</div>
						) : (
							<div className='text-center py-8 text-muted-foreground'>
								<Filter className='h-8 w-8 mx-auto mb-2 opacity-50' />
								<p>No achievements match the selected filters</p>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Comparison View */}
			{processedComparison && (
				<Card className='border-muted bg-muted/20'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<TrendingUp className='h-5 w-5' />
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
										<span className='font-bold'>{processedComparison.userMetrics.successRate.toFixed(1)}%</span>
									</div>
									<div className='flex justify-between items-center p-3 rounded-lg bg-muted/50'>
										<span>Global Average</span>
										<span className='font-bold'>{processedComparison.targetMetrics.successRate.toFixed(1)}%</span>
									</div>
									<div
										className={`flex justify-between items-center p-3 rounded-lg border ${
											(processedComparison.differences.successRate ?? 0) > 0
												? 'bg-green-500/10 border-green-500/30'
												: 'bg-red-500/10 border-red-500/30'
										}`}
									>
										<span>Difference</span>
										<div className='flex items-center gap-2'>
											{(processedComparison.differences.successRate ?? 0) > 0 ? (
												<TrendingUp className='h-4 w-4 text-green-500' />
											) : (
												<TrendingDown className='h-4 w-4 text-red-500' />
											)}
											<span
												className={`font-bold ${
													(processedComparison.differences.successRate ?? 0) > 0 ? 'text-green-500' : 'text-red-500'
												}`}
											>
												{(processedComparison.differences.successRate ?? 0) > 0 ? '+' : ''}
												{(processedComparison.differences.successRate ?? 0).toFixed(1)}%
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
										<span className='font-bold'>{processedComparison.userMetrics.averageScore.toFixed(0)}</span>
									</div>
									<div className='flex justify-between items-center p-3 rounded-lg bg-muted/50'>
										<span>Global Average</span>
										<span className='font-bold'>{processedComparison.targetMetrics.averageScore.toFixed(0)}</span>
									</div>
									<div
										className={`flex justify-between items-center p-3 rounded-lg border ${
											(processedComparison.differences.averageScore ?? 0) > 0
												? 'bg-green-500/10 border-green-500/30'
												: 'bg-red-500/10 border-red-500/30'
										}`}
									>
										<span>Difference</span>
										<div className='flex items-center gap-2'>
											{(processedComparison.differences.averageScore ?? 0) > 0 ? (
												<TrendingUp className='h-4 w-4 text-green-500' />
											) : (
												<TrendingDown className='h-4 w-4 text-red-500' />
											)}
											<span
												className={`font-bold ${
													(processedComparison.differences.averageScore ?? 0) > 0 ? 'text-green-500' : 'text-red-500'
												}`}
											>
												{(processedComparison.differences.averageScore ?? 0) > 0 ? '+' : ''}
												{(processedComparison.differences.averageScore ?? 0).toFixed(0)} points
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Rank & Percentile */}
							{processedComparison.userMetrics.rank && processedComparison.userMetrics.percentile && (
								<div className='space-y-4 md:col-span-2'>
									<h4 className='text-sm font-medium text-muted-foreground mb-3'>Ranking</h4>
									<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
										<StatCard
											icon={Hash}
											label='Your Rank'
											value={`#${processedComparison.userMetrics.rank}`}
											color={BgColor.BLUE_500}
											isLoading={analyticsLoading}
										/>
										<StatCard
											icon={Percent}
											label='Percentile'
											value={`${processedComparison.userMetrics.percentile.toFixed(1)}%`}
											subtext={`Better than ${processedComparison.userMetrics.percentile.toFixed(1)}% of players`}
											color={BgColor.PURPLE_500}
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
				<Card className='border-muted bg-muted/20'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<TrendingUp className='h-5 w-5' />
							Performance Trends Over Time
						</CardTitle>
						<CardDescription>Your score and success rate trends over time</CardDescription>
					</CardHeader>
					<CardContent>
						<TrendChart
							data={analytics.trends}
							isLoading={analyticsLoading}
							height={CHART_HEIGHTS.LARGE}
							showSuccessRate={true}
							hideCard
						/>
					</CardContent>
				</Card>
			)}

			{/* Your Performance by Difficulty + Your Topics (same row on large screens) */}
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
				<PerformanceAnalysis mainData={userDifficultyData?.difficulties} isLoading={analyticsLoading} showPersonalStats />
				{userTopicsData && userTopicsData.topics.length > 0 ? (
					<CategoryAnalysis
						topicsData={userTopicsData.topics}
						isLoading={analyticsLoading}
						showPersonalStats
					/>
				) : (
					<CategoryAnalysis topicsData={[]} isLoading={analyticsLoading} showPersonalStats />
				)}
			</div>
		</div>
	);
}
