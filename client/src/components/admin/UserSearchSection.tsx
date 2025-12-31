import { useEffect, useState } from 'react';
import {
	Activity,
	Award,
	Clock,
	Flame,
	GamepadIcon,
	Search,
	Target,
	TrendingUp,
	Trophy,
	X,
} from 'lucide-react';

import { ComparisonTarget, TimePeriod } from '@shared/constants';
import { formatForDisplay } from '@shared/utils';
import { isTimePeriod } from '@shared/validation';
import { ButtonVariant, SpinnerSize, SpinnerVariant, StatCardVariant, TextColor, ToastVariant, VALIDATION_MESSAGES, VariantBase } from '@/constants';
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Skeleton,
	Spinner,
	StatCard,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	TrendChart,
} from '@/components';
import {
	useGlobalStats,
	useToast,
	useUserComparisonById,
	useUserPerformanceById,
	useUserSummaryById,
	useUserTrendsById,
} from '@/hooks';
import { formatPlayTime } from '@/utils';

/**
 * User Search Section Component
 * Allows admin to search for users and view their analytics
 */
export function UserSearchSection() {
	const { toast } = useToast();
	const [searchUserId, setSearchUserId] = useState('');
	const [activeUserId, setActiveUserId] = useState<string | null>(null);
	const [trendsPeriod, setTrendsPeriod] = useState<TimePeriod>(TimePeriod.DAILY);

	useEffect(() => {
		if (activeUserId) {
			setSearchUserId(activeUserId);
			setTrendsPeriod(TimePeriod.DAILY);
		}
	}, [activeUserId]);

	const { data: userSummary, isLoading: userLoading } = useUserSummaryById(
		activeUserId || '',
		false,
		activeUserId !== null
	);
	const { data: userPerformance, isLoading: performanceLoading } = useUserPerformanceById(
		activeUserId || '',
		activeUserId !== null
	);
	const { data: userTrends, isLoading: trendsLoading } = useUserTrendsById(
		activeUserId || '',
		{ groupBy: trendsPeriod, limit: 30 },
		activeUserId !== null
	);
	const { data: userComparison, isLoading: comparisonLoading } = useUserComparisonById(
		activeUserId || '',
		{ target: ComparisonTarget.GLOBAL },
		activeUserId !== null
	);
	const { data: globalStats } = useGlobalStats();

	const handleSearch = () => {
		if (!searchUserId.trim()) {
			toast({
				title: 'Error',
				description: VALIDATION_MESSAGES.USER_ID_REQUIRED,
				variant: ToastVariant.DESTRUCTIVE,
			});
			return;
		}
		const trimmedUserId = searchUserId.trim();
		if (trimmedUserId === activeUserId) {
			return;
		}
		setActiveUserId(trimmedUserId);
	};

	const handleClear = () => {
		setActiveUserId(null);
		setSearchUserId('');
	};

	const summaryData = userSummary?.data;
	const performanceData = userPerformance?.data;
	const trendsData = userTrends?.data;
	const comparisonData = userComparison?.data;

	const isDataForActiveUser = activeUserId && summaryData && summaryData.user?.userId === activeUserId;

	if (!activeUserId || !isDataForActiveUser) {
		if (activeUserId && userLoading) {
			return (
				<div className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<Search className='h-5 w-5' />
								User Lookup
							</CardTitle>
							<CardDescription>Search for a user by their ID</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='flex gap-2'>
								<Input
									placeholder='Enter user ID...'
									value={searchUserId}
									onChange={e => setSearchUserId(e.target.value)}
									onKeyDown={e => e.key === 'Enter' && handleSearch()}
								/>
								<Button onClick={handleSearch} disabled={userLoading}>
									{userLoading ? <Spinner variant={SpinnerVariant.REFRESH} size={SpinnerSize.SM} /> : 'Search'}
								</Button>
								{activeUserId && (
									<Button onClick={handleClear} variant={ButtonVariant.OUTLINE} disabled={userLoading}>
										<X className='h-4 w-4' />
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
					<div className='space-y-4'>
						{[...Array(4)].map((_, i) => (
							<Skeleton key={i} className='h-24 w-full' />
						))}
					</div>
				</div>
			);
		}
		return (
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Search className='h-5 w-5' />
						User Lookup
					</CardTitle>
					<CardDescription>Search for a user by their ID</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='flex gap-2'>
						<Input
							placeholder='Enter user ID...'
							value={searchUserId}
							onChange={e => setSearchUserId(e.target.value)}
							onKeyDown={e => e.key === 'Enter' && handleSearch()}
						/>
						<Button onClick={handleSearch} disabled={userLoading}>
							{userLoading ? <Spinner variant={SpinnerVariant.REFRESH} size={SpinnerSize.SM} /> : 'Search'}
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Search className='h-5 w-5' />
						User Lookup
					</CardTitle>
					<CardDescription>Search for a user by their ID</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='flex gap-2'>
						<Input
							placeholder='Enter user ID...'
							value={searchUserId}
							onChange={e => setSearchUserId(e.target.value)}
							onKeyDown={e => e.key === 'Enter' && handleSearch()}
						/>
						<Button onClick={handleSearch} disabled={userLoading}>
							{userLoading ? <Spinner variant={SpinnerVariant.REFRESH} size={SpinnerSize.SM} /> : 'Search'}
						</Button>
						{activeUserId && (
							<Button onClick={handleClear} variant={ButtonVariant.OUTLINE} disabled={userLoading}>
								<X className='h-4 w-4' />
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			{isDataForActiveUser && (
				<Tabs key={activeUserId} defaultValue='overview' className='w-full'>
					<TabsList className='grid w-full grid-cols-4'>
						<TabsTrigger value='overview'>Overview</TabsTrigger>
						<TabsTrigger value='performance'>Performance</TabsTrigger>
						<TabsTrigger value='trends'>Trends</TabsTrigger>
						<TabsTrigger value='comparison'>Comparison</TabsTrigger>
					</TabsList>

					<TabsContent value='overview' className='mt-6 space-y-6'>
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
										<span className='text-sm font-medium'>{summaryData.user.email || 'N/A'}</span>
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
					</TabsContent>

					<TabsContent value='performance' className='mt-6 space-y-6'>
						{performanceData && (
							<>
								<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
									<StatCard
										icon={Flame}
										label='Current Streak'
										value={`${performanceData.streakDays ?? 0} days`}
										color={TextColor.ORANGE_500}
										variant={StatCardVariant.VERTICAL}
										isLoading={performanceLoading}
									/>
									<StatCard
										icon={Award}
										label='Best Streak'
										value={`${performanceData.bestStreak ?? 0} days`}
										color={TextColor.YELLOW_500}
										variant={StatCardVariant.VERTICAL}
										isLoading={performanceLoading}
									/>
									<StatCard
										icon={TrendingUp}
										label='Improvement Rate'
										value={`${formatForDisplay(performanceData.improvementRate ?? 0)}%`}
										color={TextColor.GREEN_500}
										variant={StatCardVariant.VERTICAL}
										isLoading={performanceLoading}
									/>
									<StatCard
										icon={Activity}
										label='Consistency'
										value={`${formatForDisplay(performanceData.consistencyScore ?? 0)}%`}
										color={TextColor.BLUE_500}
										variant={StatCardVariant.VERTICAL}
										isLoading={performanceLoading}
									/>
								</div>

								<Card>
									<CardHeader>
										<CardTitle>Performance Details</CardTitle>
									</CardHeader>
									<CardContent className='space-y-4'>
										<div className='flex justify-between items-center'>
											<span>Strongest Topic</span>
											<Badge variant={VariantBase.DEFAULT}>{performanceData.strongestTopic || 'N/A'}</Badge>
										</div>
										<div className='flex justify-between items-center'>
											<span>Weakest Topic</span>
											<Badge variant={VariantBase.SECONDARY}>{performanceData.weakestTopic || 'N/A'}</Badge>
										</div>
										{performanceData.averageGameTime && (
											<div className='flex justify-between items-center'>
												<span>Average Game Time</span>
												<span className='font-medium'>
													{formatPlayTime(performanceData.averageGameTime, 'seconds')}
												</span>
											</div>
										)}
									</CardContent>
								</Card>
							</>
						)}
						{performanceLoading && (
							<div className='space-y-4'>
								{[...Array(4)].map((_, i) => (
									<Skeleton key={i} className='h-24 w-full' />
								))}
							</div>
						)}
					</TabsContent>

					<TabsContent value='trends' className='mt-6 space-y-6'>
						<Tabs
							value={trendsPeriod}
							onValueChange={value => {
								if (isTimePeriod(value)) {
									setTrendsPeriod(value);
								}
							}}
							className='w-full'
						>
							<TabsList className='grid w-full grid-cols-3'>
								<TabsTrigger value={TimePeriod.DAILY}>Daily</TabsTrigger>
								<TabsTrigger value={TimePeriod.WEEKLY}>Weekly</TabsTrigger>
								<TabsTrigger value={TimePeriod.MONTHLY}>Monthly</TabsTrigger>
							</TabsList>
							<TabsContent value={trendsPeriod} className='mt-6'>
								<TrendChart data={trendsData} isLoading={trendsLoading} height={400} showSuccessRate={true} />
							</TabsContent>
						</Tabs>
					</TabsContent>

					<TabsContent value='comparison' className='mt-6 space-y-6'>
						{comparisonData && globalStats && (
							<>
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
												<span className='font-medium'>
													Top {formatForDisplay(comparisonData.userMetrics.percentile)}%
												</span>
											</div>
										)}
									</CardContent>
								</Card>
							</>
						)}
						{comparisonLoading && (
							<div className='space-y-4'>
								{[...Array(4)].map((_, i) => (
									<Skeleton key={i} className='h-24 w-full' />
								))}
							</div>
						)}
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}
