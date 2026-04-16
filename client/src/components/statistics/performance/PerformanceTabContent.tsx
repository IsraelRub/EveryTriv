import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
	Brain,
	CalendarDays,
	GamepadIcon,
	Hash,
	Medal,
	PercentCircle,
	Timer,
	TrendingDown,
	TrendingUp,
} from 'lucide-react';

import { ComparisonTarget, TIME_PERIODS_MS } from '@shared/constants';
import { formatNumericValue } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import {
	CHART_HEIGHTS,
	CommonKey,
	PlayTimeUnit,
	QUERY_KEYS,
	SEMANTIC_ICON_TEXT,
	StatisticsPerformanceKey,
	StatusDirection,
	TrendTarget,
	trendVariants,
} from '@/constants';
import { analyticsService } from '@/services';
import { formatPlayTime } from '@/utils';
import {
	Card,
	CardContent,
	CategoryAnalysis,
	EmptyState,
	PerformanceAnalysis,
	SectionCard,
	StatCard,
	TrendChart,
} from '@/components';
import { useCurrentUserData, useUserAnalytics } from '@/hooks';

export function PerformanceTabContent() {
	const { t } = useTranslation('statistics');
	const currentUser = useCurrentUserData();
	const { data: analytics, isLoading: analyticsLoading } = useUserAnalytics();

	const gameStats = analytics?.game;
	const userDifficultyData = gameStats?.difficultyBreakdown
		? {
				difficulties: gameStats.difficultyBreakdown,
			}
		: undefined;

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

	const performanceStats = analytics?.performance;

	if (!analyticsLoading && (gameStats?.totalGames ?? 0) === 0) {
		return (
			<Card>
				<CardContent className='p-6'>
					<EmptyState
						data={t(StatisticsPerformanceKey.EMPTY_DATA)}
						icon={TrendingUp}
						description={t(StatisticsPerformanceKey.EMPTY_DESCRIPTION)}
					/>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-8'>
			<SectionCard
				title={t(StatisticsPerformanceKey.STATS_AT_GLANCE)}
				icon={Brain}
				description={t(StatisticsPerformanceKey.CORE_METRICS)}
			>
				<div className='grid grid-cols-4 gap-4'>
					<StatCard
						stackIconLabel
						icon={GamepadIcon}
						label={t(StatisticsPerformanceKey.TOTAL_GAMES)}
						value={gameStats?.totalGames ?? 0}
						color={SEMANTIC_ICON_TEXT.primary}
						isLoading={analyticsLoading}
					/>
					<StatCard
						stackIconLabel
						icon={Medal}
						label={t(StatisticsPerformanceKey.BEST_SCORE)}
						value={gameStats?.bestScore ?? 0}
						color={SEMANTIC_ICON_TEXT.warning}
						isLoading={analyticsLoading}
					/>
					<StatCard
						stackIconLabel
						icon={Timer}
						label={t(StatisticsPerformanceKey.TOTAL_PLAY_TIME)}
						value={formatPlayTime(gameStats?.totalPlayTime ?? 0, PlayTimeUnit.SECONDS)}
						color={SEMANTIC_ICON_TEXT.secondary}
						isLoading={analyticsLoading}
					/>
					<StatCard
						stackIconLabel
						icon={CalendarDays}
						label={t(StatisticsPerformanceKey.CURRENT_STREAK)}
						value={formatNumericValue(performanceStats?.streakDays, 0, ` ${t(CommonKey.DAYS)}`)}
						color={SEMANTIC_ICON_TEXT.success}
						isLoading={analyticsLoading}
					/>
				</div>
			</SectionCard>

			{processedComparison?.userMetrics != null && processedComparison?.targetMetrics != null && (
				<SectionCard
					title={t(StatisticsPerformanceKey.COMPARISON_TITLE)}
					icon={TrendingUp}
					description={t(StatisticsPerformanceKey.COMPARISON_DESCRIPTION)}
				>
					<div className='grid grid-cols-2 gap-6'>
						<div className='space-y-4'>
							<h4 className='text-sm font-medium text-muted-foreground mb-3'>
								{t(StatisticsPerformanceKey.SUCCESS_RATE)}
							</h4>
							<div className='space-y-3'>
								<div className='comparison-metric-row-user'>
									<span>{t(StatisticsPerformanceKey.YOUR_AVERAGE)}</span>
									<span className='font-bold'>
										{formatNumericValue(processedComparison.userMetrics?.successRate, 1, '%')}
									</span>
								</div>
								<div className='comparison-metric-row-baseline'>
									<span>{t(StatisticsPerformanceKey.GLOBAL_AVERAGE)}</span>
									<span className='font-bold'>
										{formatNumericValue(processedComparison.targetMetrics?.successRate, 1, '%')}
									</span>
								</div>
								{(() => {
									const successDirection =
										(processedComparison.differences?.successRate ?? 0) > 0
											? StatusDirection.POSITIVE
											: StatusDirection.NEGATIVE;
									return (
										<div className={trendVariants({ direction: successDirection, target: TrendTarget.CARD })}>
											<span>{t(StatisticsPerformanceKey.DIFFERENCE)}</span>
											<div className='flex items-center gap-2'>
												{(processedComparison.differences?.successRate ?? 0) > 0 ? (
													<TrendingUp
														className={trendVariants({ direction: successDirection, target: TrendTarget.ICON })}
													/>
												) : (
													<TrendingDown
														className={trendVariants({ direction: successDirection, target: TrendTarget.ICON })}
													/>
												)}
												<span className={trendVariants({ direction: successDirection, target: TrendTarget.TEXT })}>
													{formatNumericValue(
														processedComparison.differences?.successRate,
														1,
														'%',
														(processedComparison.differences?.successRate ?? 0) > 0 ? '+' : ''
													)}
												</span>
											</div>
										</div>
									);
								})()}
							</div>
						</div>

						<div className='space-y-4'>
							<h4 className='text-sm font-medium text-muted-foreground mb-3'>
								{t(StatisticsPerformanceKey.AVERAGE_SCORE)}
							</h4>
							<div className='space-y-3'>
								<div className='comparison-metric-row-user'>
									<span>{t(StatisticsPerformanceKey.YOUR_AVERAGE)}</span>
									<span className='font-bold'>
										{formatNumericValue(processedComparison.userMetrics?.averageScore, 0)}
									</span>
								</div>
								<div className='comparison-metric-row-baseline'>
									<span>{t(StatisticsPerformanceKey.GLOBAL_AVERAGE)}</span>
									<span className='font-bold'>
										{formatNumericValue(processedComparison.targetMetrics?.averageScore, 0)}
									</span>
								</div>
								{(() => {
									const scoreDirection =
										(processedComparison.differences?.averageScore ?? 0) > 0
											? StatusDirection.POSITIVE
											: StatusDirection.NEGATIVE;
									return (
										<div className={trendVariants({ direction: scoreDirection, target: TrendTarget.CARD })}>
											<span>{t(StatisticsPerformanceKey.DIFFERENCE)}</span>
											<div className='flex items-center gap-2'>
												{(processedComparison.differences?.averageScore ?? 0) > 0 ? (
													<TrendingUp
														className={trendVariants({ direction: scoreDirection, target: TrendTarget.ICON })}
													/>
												) : (
													<TrendingDown
														className={trendVariants({ direction: scoreDirection, target: TrendTarget.ICON })}
													/>
												)}
												<span className={trendVariants({ direction: scoreDirection, target: TrendTarget.TEXT })}>
													{formatNumericValue(
														processedComparison.differences?.averageScore,
														0,
														t(StatisticsPerformanceKey.POINTS_SUFFIX),
														(processedComparison.differences?.averageScore ?? 0) > 0 ? '+' : ''
													)}
												</span>
											</div>
										</div>
									);
								})()}
							</div>
						</div>

						{processedComparison.userMetrics?.rank != null && processedComparison.userMetrics?.percentile != null && (
							<div className='col-span-2 space-y-4'>
								<h4 className='text-sm font-medium text-muted-foreground mb-3'>
									{t(StatisticsPerformanceKey.RANKING)}
								</h4>
								<div className='grid grid-cols-2 gap-4'>
									<StatCard
										icon={Hash}
										label={t(StatisticsPerformanceKey.YOUR_RANK)}
										value={`#${processedComparison.userMetrics.rank}`}
										color={SEMANTIC_ICON_TEXT.primary}
										isLoading={analyticsLoading}
									/>
									<StatCard
										icon={PercentCircle}
										label={t(StatisticsPerformanceKey.PERCENTILE)}
										value={formatNumericValue(processedComparison.userMetrics?.percentile, 1, '%')}
										subtext={t(StatisticsPerformanceKey.BETTER_THAN_PLAYERS, {
											percent: formatNumericValue(processedComparison.userMetrics?.percentile, 1, '%'),
										})}
										color={SEMANTIC_ICON_TEXT.secondary}
										isLoading={analyticsLoading}
									/>
								</div>
							</div>
						)}
					</div>
				</SectionCard>
			)}

			{analytics?.trends && analytics.trends.length > 0 && (
				<SectionCard
					title={t(StatisticsPerformanceKey.TRENDS_TITLE)}
					icon={TrendingUp}
					description={t(StatisticsPerformanceKey.TRENDS_DESCRIPTION)}
				>
					<TrendChart data={analytics.trends} isLoading={analyticsLoading} height={CHART_HEIGHTS.LARGE} />
				</SectionCard>
			)}

			<div className='grid grid-cols-2 gap-8'>
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
