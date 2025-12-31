import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, BarChart3, GamepadIcon, Settings, TrendingUp, Trophy, Users } from 'lucide-react';

import { LeaderboardPeriod, ProviderStatus as ProviderStatusEnum, TimePeriod } from '@shared/constants';
import { formatForDisplay, isRecord } from '@shared/utils';
import { isGameDifficulty, isLeaderboardPeriod } from '@shared/validation';
import { ButtonVariant, SpinnerSize, SpinnerVariant, StatCardVariant, TextColor, VariantBase } from '@/constants';
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	DifficultyBar,
	DistributionChart,
	GameStatisticsCard,
	LeaderboardTable,
	Spinner,
	ManagementActions,
	PieChart,
	Skeleton,
	StatCard,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	TrendChart,
	TriviaManagementTable,
	UserSearchSection,
	UsersTable,
} from '@/components';
import {
	useAiProviderHealth,
	useAiProviderStats,
	useAllTriviaQuestions,
	useClearAllGameHistory,
	useClearAllLeaderboard,
	useClearAllTrivia,
	useClearAllUserStats,
	useGameStatistics,
	useGlobalDifficultyStats,
	useGlobalLeaderboard,
	useGlobalStats,
	useGlobalTrends,
	useLeaderboardByPeriod,
	usePopularTopics,
	useRealTimeAnalytics,
} from '@/hooks';
import { cn } from '@/utils';

export function AdminDashboard() {
	const { data: globalStats, isLoading: statsLoading, refetch } = useGlobalStats();
	const { data: realTimeData, isLoading: realTimeLoading } = useRealTimeAnalytics();
	const { data: topicsData, isLoading: topicsLoading } = usePopularTopics();
	const { data: globalDifficultyStats, isLoading: difficultyLoading } = useGlobalDifficultyStats();
	const { data: globalData, isLoading: globalLoading } = useGlobalLeaderboard();
	const { data: weeklyData, isLoading: weeklyLoading } = useLeaderboardByPeriod(LeaderboardPeriod.WEEKLY);
	const { data: globalTrends, isLoading: trendsLoading } = useGlobalTrends({ groupBy: TimePeriod.DAILY, limit: 30 });
	const { data: aiProviderStats, isLoading: aiProviderStatsLoading } = useAiProviderStats();
	const { data: aiProviderHealth, isLoading: aiProviderHealthLoading } = useAiProviderHealth();
	const {
		data: gameStatistics,
		isLoading: gameStatisticsLoading,
		refetch: refetchGameStatistics,
	} = useGameStatistics();
	const { data: triviaQuestions, isLoading: triviaQuestionsLoading } = useAllTriviaQuestions();
	const clearGameHistory = useClearAllGameHistory();
	const clearTrivia = useClearAllTrivia();
	const clearUserStats = useClearAllUserStats();
	const clearLeaderboard = useClearAllLeaderboard();
	const [leaderboardTab, setLeaderboardTab] = useState<LeaderboardPeriod>(LeaderboardPeriod.GLOBAL);

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
			value: globalStats?.averageGames?.toLocaleString() || '0',
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
						<Spinner variant={SpinnerVariant.REFRESH} size={SpinnerSize.SM} className={cn('mr-2', !statsLoading && 'hidden')} />
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
					<TabsList className='grid w-full grid-cols-9'>
						<TabsTrigger value='overview'>Overview</TabsTrigger>
						<TabsTrigger value='realtime'>Real-time</TabsTrigger>
						<TabsTrigger value='performance'>Performance</TabsTrigger>
						<TabsTrigger value='topics'>Topics</TabsTrigger>
						<TabsTrigger value='leaderboard'>Leaderboard</TabsTrigger>
						<TabsTrigger value='games'>Games</TabsTrigger>
						<TabsTrigger value='users'>Users</TabsTrigger>
						<TabsTrigger value='system'>System</TabsTrigger>
						<TabsTrigger value='ai-providers'>AI Providers</TabsTrigger>
					</TabsList>

					<TabsContent value='overview' className='mt-6 space-y-8'>
						{/* Overview Statistics Section */}
						<Card className='border-primary/20 bg-primary/5'>
							<CardHeader>
								<CardTitle className='text-2xl font-bold flex items-center gap-2'>
									<BarChart3 className='h-6 w-6 text-primary' />
									Overview Statistics
								</CardTitle>
								<CardDescription>Global platform statistics and trends overview</CardDescription>
							</CardHeader>
						</Card>

						{/* Trends Chart Section */}
						<Card className='border-muted bg-muted/20'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<TrendingUp className='h-5 w-5' />
									Platform Trends
								</CardTitle>
								<CardDescription>Historical trends and performance metrics over time</CardDescription>
							</CardHeader>
							<CardContent>
								<TrendChart
									data={globalTrends}
									isLoading={trendsLoading}
									height={350}
									showSuccessRate={true}
									className='col-span-full'
								/>
							</CardContent>
						</Card>

						{/* Distribution Chart Section */}
						<Card className='border-muted bg-muted/20'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<BarChart3 className='h-5 w-5' />
									Key Metrics Distribution
								</CardTitle>
								<CardDescription>Success rate and consistency metrics breakdown</CardDescription>
							</CardHeader>
							<CardContent>
								<DistributionChart
									data={
										globalStats
											? [
													{
														name: 'Success Rate',
														value: globalStats.successRate ?? 0,
													},
													{
														name: 'Consistency',
														value: globalStats.consistency ?? 0,
													},
												]
											: undefined
									}
									isLoading={statsLoading}
									height={300}
									xAxisLabel='Metric'
									yAxisLabel='Percentage (%)'
									valueLabel='Percentage'
									color='hsl(var(--primary))'
								/>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value='performance' className='mt-6 space-y-8'>
						{/* Performance Analysis Section */}
						<Card className='border-primary/20 bg-primary/5'>
							<CardHeader>
								<CardTitle className='text-2xl font-bold flex items-center gap-2'>
									<BarChart3 className='h-6 w-6 text-primary' />
									Performance Analysis
								</CardTitle>
								<CardDescription>Global performance metrics and difficulty-level analysis</CardDescription>
							</CardHeader>
						</Card>

						{/* Performance Distribution Chart */}
						<Card className='border-muted bg-muted/20'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<TrendingUp className='h-5 w-5' />
									Performance by Difficulty Level
								</CardTitle>
								<CardDescription>Success rate distribution across different difficulty levels</CardDescription>
							</CardHeader>
							<CardContent>
								<DistributionChart
									data={
										globalDifficultyStats
											? Object.entries(globalDifficultyStats).map(([difficulty, stats]) => ({
													name: difficulty,
													value: stats?.successRate ?? 0,
													count: stats?.total ?? 0,
												}))
											: undefined
									}
									isLoading={difficultyLoading}
									height={350}
									xAxisLabel='Difficulty Level'
									yAxisLabel='Success Rate'
									valueLabel='Success Rate'
									countLabel='Games'
									color='hsl(var(--primary))'
								/>
							</CardContent>
						</Card>

						{/* Performance Details */}
						<Card className='border-muted bg-muted/20'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<BarChart3 className='h-5 w-5' />
									Performance by Difficulty
								</CardTitle>
								<CardDescription>Global performance across different difficulty levels</CardDescription>
							</CardHeader>
							<CardContent className='space-y-6'>
								{difficultyLoading ? (
									<div className='space-y-4'>
										{[...Array(4)].map((_, i) => (
											<div key={i} className='space-y-2'>
												<Skeleton className='h-4 w-full' />
												<Skeleton className='h-2 w-full' />
											</div>
										))}
									</div>
								) : globalDifficultyStats && Object.keys(globalDifficultyStats).length > 0 ? (
									Object.entries(globalDifficultyStats)
										.filter(([difficulty]) => isGameDifficulty(difficulty))
										.map(([difficulty, stats], index) => {
											if (!isGameDifficulty(difficulty)) return null;
											const difficultyStats = stats;
											return (
												<DifficultyBar
													key={difficulty}
													difficulty={difficulty}
													successRate={difficultyStats?.successRate ?? 0}
													gamesPlayed={difficultyStats?.total ?? 0}
													color={
														index === 0
															? '[&>div]:bg-green-500'
															: index === 1
																? '[&>div]:bg-yellow-500'
																: index === 2
																	? '[&>div]:bg-orange-500'
																	: '[&>div]:bg-red-500'
													}
												/>
											);
										})
										.filter((item): item is JSX.Element => item !== null)
								) : (
									<div className='text-center py-8 text-muted-foreground'>
										<BarChart3 className='h-12 w-12 mx-auto mb-4 opacity-50' />
										<p>No difficulty statistics available yet</p>
									</div>
								)}
							</CardContent>
						</Card>
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
									setLeaderboardTab(value);
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

					<TabsContent value='system' className='mt-6 space-y-8'>
						{/* System Management Section */}
						<Card className='border-primary/20 bg-primary/5'>
							<CardHeader>
								<CardTitle className='text-2xl font-bold flex items-center gap-2'>
									<Settings className='h-6 w-6 text-primary' />
									System Management
								</CardTitle>
								<CardDescription>Manage system data and perform administrative operations</CardDescription>
							</CardHeader>
						</Card>

						{/* System Operations */}
						<Card className='border-muted bg-muted/20'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Settings className='h-5 w-5' />
									Data Management
								</CardTitle>
								<CardDescription>Clear all data types from the system</CardDescription>
							</CardHeader>
							<CardContent>
								<ManagementActions
									operations={[
										{
											id: 'clear-game-history',
											title: 'Clear Game History',
											description: 'Delete all game history records from the system',
											itemName: 'Game History',
											currentCount: gameStatistics?.totalGames,
											onClear: () => clearGameHistory.mutate(),
											isLoading: clearGameHistory.isPending,
											icon: GamepadIcon,
										},
										{
											id: 'clear-trivia',
											title: 'Clear Trivia Questions',
											description: 'Delete all trivia questions from the database',
											itemName: 'Trivia Questions',
											currentCount: triviaQuestions?.totalCount,
											onClear: () => clearTrivia.mutate(),
											isLoading: clearTrivia.isPending,
											icon: GamepadIcon,
										},
										{
											id: 'clear-user-stats',
											title: 'Clear User Stats',
											description: 'Delete all user analytics and statistics',
											itemName: 'User Stats',
											onClear: () => clearUserStats.mutate(),
											isLoading: clearUserStats.isPending,
											icon: Activity,
										},
										{
											id: 'clear-leaderboard',
											title: 'Clear Leaderboard',
											description: 'Reset all leaderboard rankings and scores',
											itemName: 'Leaderboard',
											onClear: () => clearLeaderboard.mutate(),
											isLoading: clearLeaderboard.isPending,
											icon: Trophy,
										},
									]}
								/>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value='ai-providers' className='mt-6 space-y-8'>
						{/* AI Provider Management Section */}
						<Card className='border-primary/20 bg-primary/5'>
							<CardHeader>
								<CardTitle className='text-2xl font-bold flex items-center gap-2'>
									<Activity className='h-6 w-6 text-primary' />
									AI Provider Management
								</CardTitle>
								<CardDescription>Monitor and manage AI provider health, statistics, and performance</CardDescription>
							</CardHeader>
						</Card>

						{/* Health Status Card */}
						<Card className='border-muted bg-muted/20'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Activity className='h-5 w-5' />
									AI Provider Health Status
								</CardTitle>
								<CardDescription>Real-time health monitoring of AI providers</CardDescription>
							</CardHeader>
							<CardContent>
								{aiProviderHealthLoading ? (
									<Skeleton className='h-24 w-full' />
								) : aiProviderHealth ? (
									<div className='flex items-center justify-between'>
										<div>
											<div className='flex items-center gap-2 mb-2'>
												<Badge
													variant={
														aiProviderHealth.status === ProviderStatusEnum.HEALTHY
															? VariantBase.DEFAULT
															: aiProviderHealth.status === ProviderStatusEnum.UNHEALTHY
																? VariantBase.DESTRUCTIVE
																: VariantBase.SECONDARY
													}
												>
													{aiProviderHealth.status.toUpperCase()}
												</Badge>
												<span className='text-sm text-muted-foreground'>
													Last checked: {new Date(aiProviderHealth.timestamp).toLocaleTimeString()}
												</span>
											</div>
											<div className='grid grid-cols-2 gap-4 mt-4'>
												<div>
													<p className='text-sm text-muted-foreground'>Available Providers</p>
													<p className='text-2xl font-bold text-green-500'>{aiProviderHealth.availableProviders}</p>
												</div>
												<div>
													<p className='text-sm text-muted-foreground'>Total Providers</p>
													<p className='text-2xl font-bold'>{aiProviderHealth.totalProviders}</p>
												</div>
											</div>
											{aiProviderHealth.error && (
												<div className='mt-4 p-3 bg-destructive/10 border border-destructive rounded-md'>
													<p className='text-sm text-destructive'>{aiProviderHealth.error}</p>
												</div>
											)}
										</div>
									</div>
								) : (
									<div className='text-center py-8 text-muted-foreground'>
										<Activity className='h-12 w-12 mx-auto mb-4 opacity-50' />
										<p>No health status available</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* AI Providers Statistics */}
						<Card className='border-muted bg-muted/20'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<BarChart3 className='h-5 w-5' />
									AI Providers Statistics
								</CardTitle>
								<CardDescription>Overview of AI provider performance and status</CardDescription>
							</CardHeader>
							<CardContent>
								{aiProviderStatsLoading ? (
									<div className='space-y-4'>
										{[...Array(3)].map((_, i) => (
											<Skeleton key={i} className='h-24 w-full' />
										))}
									</div>
								) : aiProviderStats ? (
									<div className='space-y-6'>
										<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
											<StatCard
												icon={Activity}
												label='Total Providers'
												value={aiProviderStats.totalProviders}
												color={TextColor.BLUE_500}
												variant={StatCardVariant.VERTICAL}
											/>
											<StatCard
												icon={Activity}
												label='Current Provider'
												value={aiProviderStats.providers[aiProviderStats.currentProviderIndex] || 'N/A'}
												color={TextColor.GREEN_500}
												variant={StatCardVariant.VERTICAL}
											/>
											<StatCard
												icon={Activity}
												label='Active Providers'
												value={
													Object.values(aiProviderStats.providerDetails).filter((provider: unknown) => {
														if (isRecord(provider) && typeof provider.status === 'string') {
															return (
																provider.status === ProviderStatusEnum.HEALTHY ||
																provider.status === ProviderStatusEnum.ACTIVE
															);
														}
														return false;
													}).length
												}
												color={TextColor.PURPLE_500}
												variant={StatCardVariant.VERTICAL}
											/>
											<StatCard
												icon={Activity}
												label='Total Requests'
												value={Object.values(aiProviderStats.providerDetails).reduce((sum, provider) => {
													return sum + (provider.requests ?? 0);
												}, 0)}
												color={TextColor.YELLOW_500}
												variant={StatCardVariant.VERTICAL}
											/>
										</div>

										<Card className='border-muted/50 bg-muted/10'>
											<CardHeader>
												<CardTitle>Provider Details</CardTitle>
												<CardDescription>Individual provider statistics</CardDescription>
											</CardHeader>
											<CardContent>
												<div className='space-y-4'>
													{Object.entries(aiProviderStats.providerDetails).map(([name, providerStats]) => {
														return (
															<Card key={name}>
																<CardHeader className='pb-3'>
																	<div className='flex items-center justify-between'>
																		<CardTitle className='text-lg'>{name}</CardTitle>
																		<Badge
																			variant={
																				providerStats.status === ProviderStatusEnum.HEALTHY ||
																				providerStats.status === ProviderStatusEnum.ACTIVE
																					? VariantBase.DEFAULT
																					: VariantBase.DESTRUCTIVE
																			}
																		>
																			{providerStats.status || 'unknown'}
																		</Badge>
																	</div>
																</CardHeader>
																<CardContent>
																	<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
																		<div>
																			<p className='text-sm text-muted-foreground'>Requests</p>
																			<p className='text-lg font-bold'>{providerStats.requests ?? 0}</p>
																		</div>
																		<div>
																			<p className='text-sm text-muted-foreground'>Successes</p>
																			<p className='text-lg font-bold text-green-500'>{providerStats.successes ?? 0}</p>
																		</div>
																		<div>
																			<p className='text-sm text-muted-foreground'>Failures</p>
																			<p className='text-lg font-bold text-red-500'>{providerStats.failures ?? 0}</p>
																		</div>
																		<div>
																			<p className='text-sm text-muted-foreground'>Success Rate</p>
																			<p className='text-lg font-bold'>
																				{formatForDisplay(providerStats.successRate ?? 0)}%
																			</p>
																		</div>
																		<div>
																			<p className='text-sm text-muted-foreground'>Avg Response Time</p>
																			<p className='text-lg font-bold'>
																				{formatForDisplay(providerStats.averageResponseTime ?? 0)}ms
																			</p>
																		</div>
																		<div>
																			<p className='text-sm text-muted-foreground'>Error Rate</p>
																			<p className='text-lg font-bold text-red-500'>
																				{formatForDisplay(providerStats.errorRate ?? 0)}%
																			</p>
																		</div>
																		<div>
																			<p className='text-sm text-muted-foreground'>Last Used</p>
																			<p className='text-lg font-bold'>
																				{providerStats.lastUsed
																					? new Date(providerStats.lastUsed).toLocaleString()
																					: 'Never'}
																			</p>
																		</div>
																	</div>
																</CardContent>
															</Card>
														);
													})}
												</div>
											</CardContent>
										</Card>
									</div>
								) : (
									<div className='text-center py-8 text-muted-foreground'>
										<Activity className='h-12 w-12 mx-auto mb-4 opacity-50' />
										<p>No AI provider statistics available</p>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</motion.main>
	);
}
