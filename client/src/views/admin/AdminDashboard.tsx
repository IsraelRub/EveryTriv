import { motion } from 'framer-motion';
import { Activity, AlertTriangle, BarChart3, DollarSign, GamepadIcon, TrendingUp, Trophy, Users } from 'lucide-react';

import { LeaderboardPeriod } from '@shared/constants';
import { formatForDisplay } from '@shared/utils';
import { isLeaderboardPeriod } from '@shared/validation';

import { ButtonVariant, SpinnerSize, StatCardVariant, TextColor } from '@/constants';
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	DistributionChart,
	GameStatisticsCard,
	LeaderboardTable,
	PerformanceAnalysisSection,
	PieChart,
	PlatformTrendsSection,
	ProviderManagementSection,
	Skeleton,
	Spinner,
	StatCard,
	SystemHealthSection,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	TriviaManagementTable,
	UserSearchSection,
	UsersTable,
} from '@/components';
import {
	useAllTriviaQuestions,
	useAppDispatch,
	useAppSelector,
	useBusinessMetrics,
	useClearAllTrivia,
	useGameStatistics,
	useGlobalLeaderboard,
	useGlobalStats,
	useLeaderboardByPeriod,
	usePopularTopics,
	useRealTimeAnalytics,
} from '@/hooks';
import { cn } from '@/utils';
import { selectLeaderboardPeriod } from '@/redux/selectors';
import { setLeaderboardPeriod } from '@/redux/slices';

export function AdminDashboard() {
	const { data: globalStats, isLoading: statsLoading, refetch } = useGlobalStats();
	const { data: realTimeData, isLoading: realTimeLoading } = useRealTimeAnalytics();
	const { data: topicsData, isLoading: topicsLoading } = usePopularTopics();
	const { data: globalData, isLoading: globalLoading } = useGlobalLeaderboard();
	const { data: weeklyData, isLoading: weeklyLoading } = useLeaderboardByPeriod(LeaderboardPeriod.WEEKLY);
	const {
		data: gameStatistics,
		isLoading: gameStatisticsLoading,
		refetch: refetchGameStatistics,
	} = useGameStatistics();
	const { data: triviaQuestions, isLoading: triviaQuestionsLoading } = useAllTriviaQuestions();
	const clearTrivia = useClearAllTrivia();
	const { data: businessMetrics, isLoading: businessMetricsLoading } = useBusinessMetrics();
	const dispatch = useAppDispatch();
	const leaderboardTab = useAppSelector(selectLeaderboardPeriod);

	const stats = [
		{
			icon: Trophy,
			label: 'Success Rate',
			value: `${formatForDisplay(globalStats?.successRate ?? 0)}%`,
			color: TextColor.BLUE_500,
		},
		{
			icon: GamepadIcon,
			label: 'Average Games',
			value: globalStats?.averageGames?.toLocaleString() ?? '0',
			color: TextColor.GREEN_500,
		},
		{
			icon: Activity,
			label: 'Average Game Time',
			value: `${formatForDisplay((globalStats?.averageGameTime ?? 0) / 60)}m`,
			color: TextColor.YELLOW_500,
		},
		{
			icon: TrendingUp,
			label: 'Consistency',
			value: `${formatForDisplay(globalStats?.consistency ?? 0)}%`,
			color: TextColor.PURPLE_500,
		},
	];

	return (
		<motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='min-h-screen py-12 px-4'>
			<div className='max-w-7xl mx-auto space-y-8'>
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-4xl font-bold mb-2'>Admin Dashboard</h1>
						<p className='text-muted-foreground'>Overview of platform statistics</p>
					</div>
					<Button variant={ButtonVariant.OUTLINE} onClick={() => refetch()} disabled={statsLoading}>
						<Spinner size={SpinnerSize.SM} variant='refresh' className={cn('mr-2', !statsLoading && 'hidden')} />
						{statsLoading ? null : 'Refresh'}
					</Button>
				</div>

				{/* Stats Cards */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
					{stats.map((stat, index) => (
						<motion.div
							key={stat.label}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.1 }}
						>
							<StatCard {...stat} isLoading={statsLoading} variant={StatCardVariant.VERTICAL} />
						</motion.div>
					))}
				</div>

				<Tabs defaultValue='overview' className='w-full'>
					<TabsList className='grid w-full grid-cols-11'>
						<TabsTrigger value='overview'>Overview</TabsTrigger>
						<TabsTrigger value='realtime'>Real-time</TabsTrigger>
						<TabsTrigger value='performance'>Performance</TabsTrigger>
						<TabsTrigger value='topics'>Topics</TabsTrigger>
						<TabsTrigger value='leaderboard'>Leaderboard</TabsTrigger>
						<TabsTrigger value='games'>Games</TabsTrigger>
						<TabsTrigger value='users'>Users</TabsTrigger>
						<TabsTrigger value='business'>Business</TabsTrigger>
						<TabsTrigger value='system'>System</TabsTrigger>
						<TabsTrigger value='ai-providers'>AI Providers</TabsTrigger>
					</TabsList>

					<TabsContent value='overview' className='mt-6 space-y-8'>
						<PlatformTrendsSection stats={stats} statsLoading={statsLoading} />
					</TabsContent>

					<TabsContent value='performance' className='mt-6 space-y-8'>
						<PerformanceAnalysisSection />
					</TabsContent>

					<TabsContent value='topics' className='mt-6 space-y-8'>
						{/* Topic Distribution Section */}
						<Card className='border-primary/20 bg-primary/5'>
							<CardHeader>
								<CardTitle className='text-2xl font-bold flex items-center gap-2'>
									<BarChart3 className='h-6 w-6 text-primary' />
									Topic Distribution
								</CardTitle>
								<CardDescription>Popular topics and game distribution across the platform</CardDescription>
							</CardHeader>
						</Card>

						{/* Topic Charts */}
						<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
							<Card className='border-muted bg-muted/20'>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<BarChart3 className='h-5 w-5' />
										Topic Popularity
									</CardTitle>
									<CardDescription>Number of games played per topic</CardDescription>
								</CardHeader>
								<CardContent>
									<DistributionChart
										data={
											topicsData?.topics
												? topicsData.topics.slice(0, 10).map(topic => ({
														name: topic.topic,
														value: topic.totalGames,
													}))
												: undefined
										}
										isLoading={topicsLoading}
										height={350}
										xAxisLabel='Topic'
										yAxisLabel='Number of Games'
										valueLabel='Games'
										color='hsl(var(--primary))'
									/>
								</CardContent>
							</Card>

							<Card className='border-muted bg-muted/20'>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<BarChart3 className='h-5 w-5' />
										Topic Distribution
									</CardTitle>
									<CardDescription>Percentage distribution of games by topic</CardDescription>
								</CardHeader>
								<CardContent>
									<PieChart
										data={
											topicsData?.topics
												? topicsData.topics.slice(0, 8).map(topic => ({
														name: topic.topic,
														value: topic.totalGames,
													}))
												: undefined
										}
										isLoading={topicsLoading}
										height={350}
										maxItems={8}
									/>
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					<TabsContent value='leaderboard' className='mt-6 space-y-8'>
						{/* Leaderboard Rankings Section */}
						<Card className='border-primary/20 bg-primary/5'>
							<CardHeader>
								<CardTitle className='text-2xl font-bold flex items-center gap-2'>
									<Trophy className='h-6 w-6 text-primary' />
									Leaderboard Rankings
								</CardTitle>
								<CardDescription>Top players and rankings across different time periods</CardDescription>
							</CardHeader>
						</Card>

						<Tabs
							value={leaderboardTab}
							onValueChange={value => {
								if (isLeaderboardPeriod(value)) {
									dispatch(setLeaderboardPeriod(value));
								}
							}}
							className='w-full'
						>
							<TabsList className='grid w-full grid-cols-2'>
								<TabsTrigger value={LeaderboardPeriod.GLOBAL}>All Time</TabsTrigger>
								<TabsTrigger value={LeaderboardPeriod.WEEKLY}>This Week</TabsTrigger>
							</TabsList>
							<TabsContent value={LeaderboardPeriod.GLOBAL} className='mt-6'>
								<Card className='border-muted bg-muted/20'>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<Trophy className='h-5 w-5 text-yellow-500' />
											Global Leaderboard
										</CardTitle>
										<CardDescription>All-time top players and rankings</CardDescription>
									</CardHeader>
									<CardContent className='overflow-hidden'>
										<LeaderboardTable entries={Array.isArray(globalData) ? globalData : []} isLoading={globalLoading} />
									</CardContent>
								</Card>
							</TabsContent>
							<TabsContent value={LeaderboardPeriod.WEEKLY} className='mt-6'>
								<Card className='border-muted bg-muted/20'>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<Trophy className='h-5 w-5 text-blue-500' />
											Weekly Leaderboard
										</CardTitle>
										<CardDescription>Top players for this week</CardDescription>
									</CardHeader>
									<CardContent>
										<LeaderboardTable entries={Array.isArray(weeklyData) ? weeklyData : []} isLoading={weeklyLoading} />
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					</TabsContent>

					<TabsContent value='realtime' className='mt-6 space-y-8'>
						{/* Real-time Analytics Section */}
						<Card className='border-primary/20 bg-primary/5'>
							<CardHeader>
								<CardTitle className='text-2xl font-bold flex items-center gap-2'>
									<Activity className='h-6 w-6 text-primary animate-pulse' />
									Real-time Analytics
								</CardTitle>
								<CardDescription>Live platform statistics updated every 30 seconds</CardDescription>
							</CardHeader>
						</Card>

						{/* Real-time Metrics Cards */}
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
							<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
								<Card>
									<CardHeader className='pb-3'>
										<CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
											<Activity className='h-4 w-4 text-green-500 animate-pulse' />
											Real-time Success Rate
										</CardTitle>
									</CardHeader>
									<CardContent>
										{realTimeLoading ? (
											<Skeleton className='h-8 w-20' />
										) : (
											<div className='text-3xl font-bold text-green-500'>
												{formatForDisplay(realTimeData?.successRate ?? 0)}%
											</div>
										)}
									</CardContent>
								</Card>
							</motion.div>
							<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
								<Card>
									<CardHeader className='pb-3'>
										<CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
											<GamepadIcon className='h-4 w-4 text-blue-500' />
											Real-time Average Games
										</CardTitle>
									</CardHeader>
									<CardContent>
										{realTimeLoading ? (
											<Skeleton className='h-8 w-20' />
										) : (
											<div className='text-3xl font-bold text-blue-500'>
												{realTimeData?.averageGames?.toLocaleString() ?? 0}
											</div>
										)}
									</CardContent>
								</Card>
							</motion.div>
							<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
								<Card>
									<CardHeader className='pb-3'>
										<CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
											<Activity className='h-4 w-4 text-yellow-500' />
											Real-time Game Time
										</CardTitle>
									</CardHeader>
									<CardContent>
										{realTimeLoading ? (
											<Skeleton className='h-8 w-20' />
										) : (
											<div className='text-3xl font-bold text-yellow-500'>
												{formatForDisplay((realTimeData?.averageGameTime ?? 0) / 60)}m
											</div>
										)}
									</CardContent>
								</Card>
							</motion.div>
							<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
								<Card>
									<CardHeader className='pb-3'>
										<CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
											<TrendingUp className='h-4 w-4 text-purple-500' />
											Real-time Consistency
										</CardTitle>
									</CardHeader>
									<CardContent>
										{realTimeLoading ? (
											<Skeleton className='h-8 w-20' />
										) : (
											<div className='text-3xl font-bold text-purple-500'>
												{formatForDisplay(realTimeData?.consistency ?? 0)}%
											</div>
										)}
									</CardContent>
								</Card>
							</motion.div>
						</div>

						{/* Real-time Distribution Chart */}
						<Card className='border-muted bg-muted/20'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<BarChart3 className='h-5 w-5' />
									Real-time Metrics Distribution
								</CardTitle>
								<CardDescription>Current success rate and consistency metrics</CardDescription>
							</CardHeader>
							<CardContent>
								<DistributionChart
									data={
										realTimeData
											? [
													{
														name: 'Success Rate',
														value: realTimeData.successRate ?? 0,
													},
													{
														name: 'Consistency',
														value: realTimeData.consistency ?? 0,
													},
												]
											: undefined
									}
									isLoading={realTimeLoading}
									height={300}
									xAxisLabel='Metric'
									yAxisLabel='Percentage (%)'
									valueLabel='Percentage'
									color='hsl(var(--color-success-500))'
								/>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value='users' className='mt-6 space-y-8'>
						{/* User Management Section */}
						<Card className='border-primary/20 bg-primary/5'>
							<CardHeader>
								<CardTitle className='text-2xl font-bold flex items-center gap-2'>
									<Users className='h-6 w-6 text-primary' />
									User Management
								</CardTitle>
								<CardDescription>View and manage all users in the system</CardDescription>
							</CardHeader>
						</Card>

						<Tabs defaultValue='all' className='w-full'>
							<TabsList className='grid w-full grid-cols-2'>
								<TabsTrigger value='all'>All Users</TabsTrigger>
								<TabsTrigger value='search'>Search</TabsTrigger>
							</TabsList>
							<TabsContent value='all' className='mt-6'>
								<Card className='border-muted bg-muted/20'>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<Users className='h-5 w-5' />
											All Users
										</CardTitle>
										<CardDescription>Complete list of all registered users</CardDescription>
									</CardHeader>
									<CardContent>
										<UsersTable />
									</CardContent>
								</Card>
							</TabsContent>
							<TabsContent value='search' className='mt-6'>
								<Card className='border-muted bg-muted/20'>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<Users className='h-5 w-5' />
											Search Users
										</CardTitle>
										<CardDescription>Search and filter users by various criteria</CardDescription>
									</CardHeader>
									<CardContent>
										<UserSearchSection />
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					</TabsContent>

					<TabsContent value='games' className='mt-6 space-y-8'>
						{/* Game Management Section */}
						<Card className='border-primary/20 bg-primary/5'>
							<CardHeader>
								<CardTitle className='text-2xl font-bold flex items-center gap-2'>
									<GamepadIcon className='h-6 w-6 text-primary' />
									Game Management
								</CardTitle>
								<CardDescription>Manage game statistics and trivia questions</CardDescription>
							</CardHeader>
						</Card>

						{/* Game Statistics */}
						<Card className='border-muted bg-muted/20'>
							<CardContent className='pt-6'>
								<GameStatisticsCard
									data={gameStatistics}
									isLoading={gameStatisticsLoading}
									onRefresh={() => refetchGameStatistics()}
								/>
							</CardContent>
						</Card>

						{/* Trivia Management */}
						<Card className='border-muted bg-muted/20'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<GamepadIcon className='h-5 w-5' />
									Trivia Questions Management
								</CardTitle>
								<CardDescription>View and manage all trivia questions in the system</CardDescription>
							</CardHeader>
							<CardContent>
								<TriviaManagementTable
									questions={triviaQuestions?.questions}
									totalCount={triviaQuestions?.totalCount}
									isLoading={triviaQuestionsLoading}
									onClearAll={() => clearTrivia.mutate()}
								/>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value='business' className='mt-6 space-y-8'>
						{/* Business Metrics Section */}
						<Card className='border-primary/20 bg-primary/5'>
							<CardHeader>
								<CardTitle className='text-2xl font-bold flex items-center gap-2'>
									<DollarSign className='h-6 w-6 text-primary' />
									Business Metrics
								</CardTitle>
								<CardDescription>Revenue, user growth, and engagement metrics</CardDescription>
							</CardHeader>
						</Card>

						{/* Business Metrics Cards */}
						{businessMetricsLoading ? (
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
								{[...Array(4)].map((_, i) => (
									<Skeleton key={i} className='h-32 w-full' />
								))}
							</div>
						) : businessMetrics ? (
							<>
								{/* Revenue Metrics */}
								<Card className='border-muted bg-muted/20'>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<DollarSign className='h-5 w-5' />
											Revenue Metrics
										</CardTitle>
										<CardDescription>Financial performance and revenue indicators</CardDescription>
									</CardHeader>
									<CardContent>
										<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
											<StatCard
												icon={DollarSign}
												label='Total Revenue'
												value={`$${formatForDisplay(businessMetrics.revenue.total)}`}
												color={TextColor.GREEN_500}
												variant={StatCardVariant.VERTICAL}
											/>
											<StatCard
												icon={TrendingUp}
												label='Monthly Recurring Revenue (MRR)'
												value={`$${formatForDisplay(businessMetrics.revenue.mrr)}`}
												color={TextColor.BLUE_500}
												variant={StatCardVariant.VERTICAL}
											/>
											<StatCard
												icon={Users}
												label='Average Revenue Per User (ARPU)'
												value={`$${formatForDisplay(businessMetrics.revenue.arpu)}`}
												color={TextColor.PURPLE_500}
												variant={StatCardVariant.VERTICAL}
											/>
										</div>
									</CardContent>
								</Card>

								{/* User Metrics */}
								<Card className='border-muted bg-muted/20'>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<Users className='h-5 w-5' />
											User Metrics
										</CardTitle>
										<CardDescription>User growth and retention metrics</CardDescription>
									</CardHeader>
									<CardContent>
										<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
											<StatCard
												icon={Users}
												label='Total Users'
												value={businessMetrics.users.total.toLocaleString()}
												color={TextColor.BLUE_500}
												variant={StatCardVariant.VERTICAL}
											/>
											<StatCard
												icon={Activity}
												label='Active Users'
												value={businessMetrics.users.active.toLocaleString()}
												color={TextColor.GREEN_500}
												variant={StatCardVariant.VERTICAL}
											/>
											<StatCard
												icon={TrendingUp}
												label='New This Month'
												value={businessMetrics.users.newThisMonth.toLocaleString()}
												color={TextColor.PURPLE_500}
												variant={StatCardVariant.VERTICAL}
											/>
											<StatCard
												icon={AlertTriangle}
												label='Churn Rate'
												value={`${formatForDisplay(businessMetrics.users.churnRate)}%`}
												color={TextColor.RED_500}
												variant={StatCardVariant.VERTICAL}
											/>
										</div>
									</CardContent>
								</Card>

								{/* Engagement Metrics */}
								<Card className='border-muted bg-muted/20'>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<Activity className='h-5 w-5' />
											Engagement Metrics
										</CardTitle>
										<CardDescription>User engagement and activity indicators</CardDescription>
									</CardHeader>
									<CardContent>
										<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
											<StatCard
												icon={Users}
												label='Daily Active Users (DAU)'
												value={businessMetrics.engagement.dau.toLocaleString()}
												color={TextColor.BLUE_500}
												variant={StatCardVariant.VERTICAL}
											/>
											<StatCard
												icon={Users}
												label='Weekly Active Users (WAU)'
												value={businessMetrics.engagement.wau.toLocaleString()}
												color={TextColor.GREEN_500}
												variant={StatCardVariant.VERTICAL}
											/>
											<StatCard
												icon={Users}
												label='Monthly Active Users (MAU)'
												value={businessMetrics.engagement.mau.toLocaleString()}
												color={TextColor.PURPLE_500}
												variant={StatCardVariant.VERTICAL}
											/>
											<StatCard
												icon={BarChart3}
												label='Avg Session Duration'
												value={`${formatForDisplay(businessMetrics.engagement.avgSessionDuration / 60)}m`}
												color={TextColor.YELLOW_500}
												variant={StatCardVariant.VERTICAL}
											/>
										</div>
									</CardContent>
								</Card>
							</>
						) : (
							<Card>
								<CardContent className='p-6 text-center text-muted-foreground'>
									<DollarSign className='h-12 w-12 mx-auto mb-4 opacity-50' />
									<p>No business metrics available</p>
								</CardContent>
							</Card>
						)}
					</TabsContent>

					<TabsContent value='system' className='mt-6 space-y-8'>
						<SystemHealthSection />
					</TabsContent>

					<TabsContent value='ai-providers' className='mt-6 space-y-8'>
						<ProviderManagementSection />
					</TabsContent>
				</Tabs>
			</div>
		</motion.main>
	);
}
