import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import {
	AlertTriangle,
	BarChart3,
	BookOpen,
	Calendar,
	Clock,
	Flame,
	GamepadIcon,
	Loader2,
	Medal,
	Target,
	Timer,
	Trash2,
	TrendingUp,
	Trophy,
	User,
} from 'lucide-react';

import { LeaderboardPeriod } from '@shared/constants';
import type { GameDifficulty } from '@shared/types';
import { roundForDisplay } from '@shared/utils';
import { isGameDifficulty, isLeaderboardPeriod } from '@shared/validation';

import {
	BgColor,
	ButtonSize,
	ButtonVariant,
	ROUTES,
	StatCardVariant,
	TextColor,
	ToastVariant,
	VariantBase,
} from '@/constants';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Avatar,
	AvatarFallback,
	AvatarImage,
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	DifficultyBar,
	DistributionChart,
	LeaderboardTable,
	OverviewSkeleton,
	PieChart,
	Skeleton,
	StatCard,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	TopicBar,
	TrendChart,
} from '@/components';

import {
	useClearGameHistory,
	useDeleteGameHistory,
	useGameHistory,
	useGlobalDifficultyStats,
	useGlobalLeaderboard,
	useLeaderboardByPeriod,
	usePopularTopics,
	useToast,
	useUserAnalytics,
	useUserProfile,
	useUserRanking,
} from '@/hooks';

import type { DistributionDataPoint, PieChartDataPoint, RootState } from '@/types';

import { formatDate, formatDuration, formatPlayTime, getAvatarUrl, getDifficultyBadgeColor } from '@/utils';

export function StatisticsView() {
	const navigate = useNavigate();
	const { toast } = useToast();
	const { isAuthenticated, currentUser, avatar: reduxAvatar } = useSelector((state: RootState) => state.user);
	const [leaderboardTab, setLeaderboardTab] = useState<LeaderboardPeriod>(LeaderboardPeriod.GLOBAL);
	const [showClearDialog, setShowClearDialog] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const { data: analytics, isLoading: analyticsLoading } = useUserAnalytics();
	const { data: globalDifficultyStats } = useGlobalDifficultyStats();
	const { data: popularTopicsData } = usePopularTopics();
	const { data: globalData, isLoading: globalLoading } = useGlobalLeaderboard();
	const { data: weeklyData, isLoading: weeklyLoading } = useLeaderboardByPeriod(LeaderboardPeriod.WEEKLY);
	const { data: userRanking, isLoading: rankLoading } = useUserRanking();
	const { data: historyData, isLoading: historyLoading, error: historyError } = useGameHistory(50, 0);
	const deleteHistory = useDeleteGameHistory();
	const clearHistory = useClearGameHistory();
	const { data: userProfile } = useUserProfile();

	const profile = userProfile?.profile;
	const currentAvatarId = reduxAvatar ?? profile?.avatar ?? undefined;
	const avatarUrl = useMemo(() => {
		return getAvatarUrl(currentAvatarId);
	}, [currentAvatarId]);

	const getDisplayName = () => {
		if (profile?.firstName && profile?.lastName) {
			return `${profile.firstName} ${profile.lastName}`;
		}
		if (profile?.firstName) {
			return profile.firstName;
		}
		return currentUser?.email?.split('@')[0] || 'User';
	};

	const getUserInitials = () => {
		if (profile?.firstName) {
			return profile.firstName.charAt(0).toUpperCase();
		}
		if (currentUser?.email) {
			return currentUser.email.charAt(0).toUpperCase();
		}
		return 'U';
	};

	const gameStats = analytics?.game;
	const performanceStats = analytics?.performance;

	const globalEntries = Array.isArray(globalData) ? globalData : [];
	const weeklyEntries = Array.isArray(weeklyData) ? weeklyData : [];
	const records = Array.isArray(historyData) ? historyData : [];

	const defaultTab = isAuthenticated ? 'overview' : 'leaderboard';

	const handleDelete = async (gameId: string) => {
		try {
			await deleteHistory.mutateAsync(gameId);
			toast({
				title: 'Game Deleted',
				description: 'The game record has been removed from your history.',
			});
		} catch {
			toast({
				title: 'Error',
				description: 'Failed to delete game record.',
				variant: ToastVariant.DESTRUCTIVE,
			});
		} finally {
			setDeleteId(null);
		}
	};

	const handleClearAll = async () => {
		try {
			const result = await clearHistory.mutateAsync();
			toast({
				title: 'History Cleared',
				description: `${result.deletedCount} game records have been removed.`,
			});
		} catch {
			toast({
				title: 'Error',
				description: 'Failed to clear game history.',
				variant: ToastVariant.DESTRUCTIVE,
			});
		} finally {
			setShowClearDialog(false);
		}
	};

	// Calculate history stats
	const totalGames = records.length;
	const totalScore = records.reduce((sum, r) => sum + (r.score ?? 0), 0);
	const avgScore = totalGames > 0 ? roundForDisplay(totalScore / totalGames) : 0;
	const bestScore = records.length > 0 ? Math.max(...records.map(r => r.score ?? 0)) : 0;

	// Use user-specific data from analytics instead of global data
	const userDifficultyData = gameStats?.difficultyBreakdown
		? {
				difficulties: gameStats.difficultyBreakdown,
			}
		: undefined;

	const userTopicsData = gameStats?.topicsPlayed
		? {
				topics: Object.entries(gameStats.topicsPlayed)
					.map(([topic, count]) => ({
						topic,
						totalGames: typeof count === 'number' && Number.isFinite(count) ? count : 0,
					}))
					.filter(t => t.totalGames > 0)
					.sort((a, b) => b.totalGames - a.totalGames),
			}
		: undefined;

	return (
		<motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='min-h-screen py-12 px-4'>
			<div className='max-w-7xl mx-auto space-y-8'>
				<div className='text-center'>
					<h1 className='text-4xl font-bold mb-2'>Statistics</h1>
					<p className='text-muted-foreground'>
						{isAuthenticated
							? 'View your statistics, leaderboard, and game history'
							: 'See how you rank against other players'}
					</p>
				</div>

				<Tabs defaultValue={defaultTab} className='w-full'>
					<TabsList className='grid w-full max-w-lg mx-auto grid-cols-5'>
						{isAuthenticated && <TabsTrigger value='overview'>Overview</TabsTrigger>}
						{isAuthenticated && <TabsTrigger value='performance'>Performance</TabsTrigger>}
						{isAuthenticated && <TabsTrigger value='categories'>Categories</TabsTrigger>}
						{isAuthenticated && <TabsTrigger value='history'>History</TabsTrigger>}
						<TabsTrigger value='leaderboard'>Leaderboard</TabsTrigger>
					</TabsList>

					{isAuthenticated && (
						<TabsContent value='overview' className='mt-6 space-y-8'>
							{analyticsLoading ? (
								<OverviewSkeleton />
							) : (
								<>
									{/* Your Statistics Overview Section */}
									<Card className='border-primary/20 bg-primary/5'>
										<CardHeader>
											<CardTitle className='text-2xl font-bold flex items-center gap-2'>
												<BarChart3 className='h-6 w-6 text-primary' />
												Your Statistics Overview
											</CardTitle>
											<CardDescription>Complete overview of your game statistics and performance</CardDescription>
										</CardHeader>
									</Card>

									{/* Your Statistics Section */}
									<Card className='border-primary/20 bg-primary/5'>
										<CardHeader>
											<div className='flex items-center gap-4 mb-4'>
												<Avatar className='h-16 w-16 border-2 border-primary/20'>
													<AvatarImage src={avatarUrl} alt={getDisplayName()} />
													<AvatarFallback className='text-xl'>{getUserInitials()}</AvatarFallback>
												</Avatar>
												<div>
													<CardTitle className='text-2xl flex items-center gap-2'>
														<User className='h-6 w-6 text-primary' />
														Your Statistics
													</CardTitle>
													<CardDescription className='text-base'>{getDisplayName()}</CardDescription>
												</div>
											</div>
										</CardHeader>
										<CardContent>
											<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
												<StatCard
													icon={Target}
													label='Total Credits'
													value={analytics?.basic.totalCredits ?? 0}
													color={TextColor.GREEN_500}
													variant={StatCardVariant.CENTERED}
													animate
													countUp
												/>
											</div>
										</CardContent>
									</Card>

									{/* Additional User Stats */}
									<Card className='border-muted bg-muted/20'>
										<CardHeader>
											<CardTitle className='flex items-center gap-2'>
												<GamepadIcon className='h-5 w-5' />
												Game Statistics
											</CardTitle>
											<CardDescription>Your overall game performance metrics</CardDescription>
										</CardHeader>
										<CardContent>
											<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
												<StatCard
													icon={GamepadIcon}
													label='Total Games'
													value={gameStats?.totalGames ?? 0}
													color={BgColor.BLUE_500}
													countUp
												/>
												<StatCard
													icon={Target}
													label='Success Rate'
													value={`${roundForDisplay(gameStats?.successRate ?? 0)}%`}
													subtext={`${gameStats?.correctAnswers ?? 0}/${gameStats?.totalQuestionsAnswered ?? 0} correct`}
													color={BgColor.GREEN_500}
												/>
												<StatCard
													icon={Trophy}
													label='Best Score'
													value={gameStats?.bestScore ?? 0}
													color={BgColor.YELLOW_500}
													countUp
												/>
												<StatCard
													icon={Timer}
													label='Total Play Time'
													value={formatPlayTime(gameStats?.totalPlayTime ?? 0, 'seconds')}
													color={BgColor.PURPLE_500}
												/>
											</div>
										</CardContent>
									</Card>

									{/* Trends Chart */}
									<Card className='border-muted bg-muted/20'>
										<CardHeader>
											<CardTitle className='flex items-center gap-2'>
												<TrendingUp className='h-5 w-5' />
												Performance Trends
											</CardTitle>
											<CardDescription>Your performance trends over time</CardDescription>
										</CardHeader>
										<CardContent>
											<TrendChart
												data={analytics?.trends}
												isLoading={analyticsLoading}
												height={350}
												showSuccessRate={true}
												className='col-span-full'
											/>
										</CardContent>
									</Card>

									{/* Score and Streaks */}
									<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
										<Card className='border-muted bg-muted/20'>
											<CardHeader>
												<CardTitle className='flex items-center gap-2'>
													<TrendingUp className='h-5 w-5' />
													Score Progression
												</CardTitle>
												<CardDescription>Your scoring performance</CardDescription>
											</CardHeader>
											<CardContent className='space-y-4'>
												<div className='flex justify-between items-center'>
													<span>Average Score</span>
													<span className='font-bold'>{roundForDisplay(gameStats?.averageScore ?? 0)}</span>
												</div>
												<div className='flex justify-between items-center'>
													<span>Best Score</span>
													<span className='font-bold text-green-500'>
														{(gameStats?.bestScore ?? 0).toLocaleString()}
													</span>
												</div>
												<div className='flex justify-between items-center'>
													<span>Total Score</span>
													<span className='font-bold'>
														{((gameStats?.averageScore ?? 0) * (gameStats?.totalGames ?? 0)).toLocaleString()}
													</span>
												</div>
											</CardContent>
										</Card>

										<Card className='border-muted bg-muted/20'>
											<CardHeader>
												<CardTitle className='flex items-center gap-2'>
													<Flame className='h-5 w-5 text-orange-500' />
													Streaks
												</CardTitle>
												<CardDescription>Your consistency</CardDescription>
											</CardHeader>
											<CardContent className='space-y-4'>
												<div className='flex justify-between items-center'>
													<span>Current Streak</span>
													<span className='font-bold text-orange-500'>{performanceStats?.streakDays ?? 0} days</span>
												</div>
												<div className='flex justify-between items-center'>
													<span>Best Streak</span>
													<span className='font-bold'>{performanceStats?.bestStreak ?? 0} days</span>
												</div>
												<div className='flex justify-between items-center'>
													<span>Improvement Rate</span>
													<span className='font-bold'>{roundForDisplay(performanceStats?.improvementRate ?? 0)}%</span>
												</div>
											</CardContent>
										</Card>
									</div>

									{/* Most Played Topic */}
									<Card className='border-muted bg-muted/20'>
										<CardHeader>
											<CardTitle className='flex items-center gap-2'>
												<BookOpen className='h-5 w-5 text-indigo-500' />
												Most Played Topic
											</CardTitle>
											<CardDescription>Your most played topic</CardDescription>
										</CardHeader>
										<CardContent>
											<div className='flex items-center justify-center py-4'>
												<p className='text-3xl font-bold text-indigo-500'>
													{gameStats?.mostPlayedTopic && gameStats.mostPlayedTopic !== 'None'
														? gameStats.mostPlayedTopic
														: 'None'}
												</p>
											</div>
											{gameStats?.mostPlayedTopic && gameStats.mostPlayedTopic !== 'None' ? (
												<p className='text-center text-sm text-muted-foreground mt-2'>
													Most questions answered in this topic
												</p>
											) : (
												<p className='text-center text-sm text-muted-foreground mt-2'>
													Play more games to see your most played topic
												</p>
											)}
										</CardContent>
									</Card>
								</>
							)}
						</TabsContent>
					)}

					{isAuthenticated && (
						<TabsContent value='performance' className='mt-6 space-y-8'>
							{/* Performance Analysis Section */}
							<Card className='border-primary/20 bg-primary/5'>
								<CardHeader>
									<CardTitle className='text-2xl font-bold flex items-center gap-2'>
										<BarChart3 className='h-6 w-6 text-primary' />
										Performance Analysis
									</CardTitle>
									<CardDescription>
										Detailed analysis of your performance across different difficulty levels
									</CardDescription>
								</CardHeader>
							</Card>

							{/* Performance Chart */}
							<Card className='border-muted bg-muted/20'>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<TrendingUp className='h-5 w-5' />
										Performance by Difficulty Level
									</CardTitle>
									<CardDescription>
										Your success rate compared to global averages across difficulty levels
									</CardDescription>
								</CardHeader>
								<CardContent>
									<DistributionChart
										data={
											userDifficultyData?.difficulties
												? (() => {
														const result: DistributionDataPoint[] = [];
														for (const [difficulty, stats] of Object.entries(userDifficultyData.difficulties)) {
															if (isGameDifficulty(difficulty) && stats) {
																const gameDifficulty: GameDifficulty = difficulty;
																result.push({
																	name: gameDifficulty,
																	value: stats.successRate ?? 0,
																	count: stats.total,
																});
															}
														}
														return result;
													})()
												: undefined
										}
										comparisonData={
											globalDifficultyStats
												? (() => {
														const result: PieChartDataPoint[] = [];
														for (const [difficulty, stats] of Object.entries(globalDifficultyStats)) {
															if (isGameDifficulty(difficulty) && stats) {
																const gameDifficulty: GameDifficulty = difficulty;
																result.push({
																	name: gameDifficulty,
																	value: stats.successRate ?? 0,
																});
															}
														}
														return result;
													})()
												: undefined
										}
										isLoading={analyticsLoading}
										height={350}
										xAxisLabel='Difficulty Level'
										yAxisLabel='Success Rate'
										valueLabel='Success Rate'
										countLabel='Games'
										color='hsl(var(--primary))'
										comparisonColor='hsl(var(--muted-foreground) / 0.4)'
									/>
								</CardContent>
							</Card>

							{/* Performance Details */}
							<Card className='border-primary/20 bg-primary/5'>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<BarChart3 className='h-5 w-5 text-primary' />
										Your Performance by Difficulty
									</CardTitle>
									<CardDescription>
										How you perform at different difficulty levels compared to global averages
									</CardDescription>
								</CardHeader>
								<CardContent className='space-y-6'>
									{analyticsLoading ? (
										<div className='space-y-4'>
											{[...Array(4)].map((_, i) => (
												<div key={i} className='space-y-2'>
													<Skeleton className='h-4 w-full' />
													<Skeleton className='h-2 w-full' />
												</div>
											))}
										</div>
									) : userDifficultyData?.difficulties && Object.keys(userDifficultyData.difficulties).length > 0 ? (
										Object.entries(userDifficultyData.difficulties)
											.filter(([difficulty]) => isGameDifficulty(difficulty))
											.map(([difficulty, stats], index) => {
												if (!isGameDifficulty(difficulty) || !stats) return null;
												const globalStats = globalDifficultyStats?.[difficulty];
												const globalSuccessRate = globalStats?.successRate;

												return (
													<DifficultyBar
														key={difficulty}
														difficulty={difficulty}
														successRate={stats.successRate ?? 0}
														gamesPlayed={stats.total}
														globalSuccessRate={globalSuccessRate}
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
											<p>Play more games to see difficulty stats</p>
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>
					)}

					{isAuthenticated && (
						<TabsContent value='categories' className='mt-6 space-y-8'>
							{/* Category Breakdown Section */}
							<Card className='border-primary/20 bg-primary/5'>
								<CardHeader>
									<CardTitle className='text-2xl font-bold flex items-center gap-2'>
										<BookOpen className='h-6 w-6 text-primary' />
										Category Breakdown
									</CardTitle>
									<CardDescription>Your topics and categories compared to global popularity</CardDescription>
								</CardHeader>
							</Card>

							{/* Category Charts */}
							<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
								<Card className='border-muted bg-muted/20'>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<BarChart3 className='h-5 w-5' />
											Topic Popularity
										</CardTitle>
										<CardDescription>Your topics compared to global popularity</CardDescription>
									</CardHeader>
									<CardContent>
										<DistributionChart
											data={
												userTopicsData?.topics
													? userTopicsData.topics.slice(0, 10).map(topic => ({
															name: topic.topic,
															value: topic.totalGames,
														}))
													: undefined
											}
											comparisonData={
												popularTopicsData?.topics
													? popularTopicsData.topics.slice(0, 10).map(topic => ({
															name: topic.topic,
															value: topic.totalGames,
														}))
													: undefined
											}
											isLoading={analyticsLoading}
											height={350}
											xAxisLabel='Topic'
											yAxisLabel='Number of Games'
											valueLabel='Games'
											color='hsl(var(--primary))'
											comparisonColor='hsl(var(--muted-foreground) / 0.4)'
										/>
									</CardContent>
								</Card>
								<Card className='border-muted bg-muted/20'>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<BarChart3 className='h-5 w-5' />
											Topic Distribution
										</CardTitle>
										<CardDescription>Percentage distribution of your games by topic</CardDescription>
									</CardHeader>
									<CardContent>
										<PieChart
											data={
												userTopicsData?.topics
													? userTopicsData.topics.slice(0, 8).map(topic => ({
															name: topic.topic,
															value: topic.totalGames,
														}))
													: undefined
											}
											isLoading={analyticsLoading}
											height={350}
											maxItems={8}
										/>
									</CardContent>
								</Card>
							</div>

							{/* Your Topics Details */}
							<Card className='border-primary/20 bg-primary/5'>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<BookOpen className='h-5 w-5 text-primary' />
										Your Topics
									</CardTitle>
									<CardDescription>Your most played topics</CardDescription>
								</CardHeader>
								<CardContent className='space-y-6 overflow-hidden'>
									{gameStats?.mostPlayedTopic && gameStats.mostPlayedTopic !== 'None' && (
										<div className='p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg'>
											<div className='flex items-center gap-3'>
												<BookOpen className='h-5 w-5 text-indigo-500' />
												<div>
													<p className='text-sm font-medium text-muted-foreground'>Most Played Topic</p>
													<p className='text-xl font-bold text-indigo-500'>{gameStats.mostPlayedTopic}</p>
													<p className='text-xs text-muted-foreground mt-1'>
														Your most played topic based on questions answered
													</p>
												</div>
											</div>
										</div>
									)}
									{analyticsLoading ? (
										<div className='space-y-4 overflow-hidden'>
											{[...Array(5)].map((_, i) => (
												<div key={i} className='space-y-2 overflow-hidden'>
													<Skeleton className='h-4 w-full max-w-full' />
													<Skeleton className='h-2 w-full max-w-full' />
												</div>
											))}
										</div>
									) : userTopicsData?.topics && userTopicsData.topics.length > 0 ? (
										(() => {
											const maxCount = Math.max(...userTopicsData.topics.map(t => t.totalGames));
											return userTopicsData.topics
												.slice(0, 10)
												.map(topic => (
													<TopicBar
														key={topic.topic}
														topic={topic.topic}
														count={topic.totalGames}
														maxCount={maxCount}
													/>
												));
										})()
									) : (
										<div className='text-center py-8 text-muted-foreground'>
											<BookOpen className='h-12 w-12 mx-auto mb-4 opacity-50' />
											<p>Play more games to see topic stats</p>
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>
					)}

					{isAuthenticated && (
						<TabsContent value='history' className='mt-6 space-y-8'>
							{/* Game History Section */}
							<Card className='border-primary/20 bg-primary/5'>
								<CardHeader>
									<CardTitle className='text-2xl font-bold flex items-center gap-2'>
										<Clock className='h-6 w-6 text-primary' />
										Game History
									</CardTitle>
									<CardDescription>View your past game performances and detailed statistics</CardDescription>
								</CardHeader>
							</Card>

							{historyLoading ? (
								<div className='space-y-4'>
									<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
										{[...Array(4)].map((_, i) => (
											<Card key={i}>
												<CardContent className='pt-6'>
													<Skeleton className='h-8 w-24 mb-2' />
													<Skeleton className='h-4 w-16' />
												</CardContent>
											</Card>
										))}
									</div>
									<Card>
										<CardContent className='p-6'>
											<div className='space-y-4'>
												{[...Array(5)].map((_, i) => (
													<Skeleton key={i} className='h-12 w-full' />
												))}
											</div>
										</CardContent>
									</Card>
								</div>
							) : historyError ? (
								<Card>
									<CardContent className='p-6 text-center'>
										<AlertTriangle className='h-16 w-16 text-destructive mx-auto mb-4' />
										<h2 className='text-2xl font-bold mb-2'>Failed to Load History</h2>
										<p className='text-muted-foreground mb-6'>
											Unable to fetch your game history. Please try again later.
										</p>
										<Button onClick={() => navigate(ROUTES.HOME)}>Return Home</Button>
									</CardContent>
								</Card>
							) : records.length === 0 ? (
								<Card>
									<CardContent className='p-6 text-center'>
										<Medal className='h-16 w-16 text-muted-foreground mx-auto mb-4' />
										<h2 className='text-3xl font-bold mb-2'>No Games Yet</h2>
										<p className='text-muted-foreground mb-6'>
											Start playing trivia games to build your history and track your progress!
										</p>
										<Button size={ButtonSize.LG} onClick={() => navigate(ROUTES.HOME)}>
											Play Now
										</Button>
									</CardContent>
								</Card>
							) : (
								<>
									{/* Stats Summary */}
									<Card className='border-muted bg-muted/20'>
										<CardHeader>
											<div className='flex items-center justify-between'>
												<div>
													<CardTitle className='flex items-center gap-2'>
														<BarChart3 className='h-5 w-5' />
														History Summary
													</CardTitle>
													<CardDescription>Overview of your game history statistics</CardDescription>
												</div>
												<Button
													variant={ButtonVariant.DESTRUCTIVE}
													size={ButtonSize.SM}
													onClick={() => setShowClearDialog(true)}
												>
													<Trash2 className='h-4 w-4 mr-2' />
													Clear All
												</Button>
											</div>
										</CardHeader>
										<CardContent>
											<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
												<Card className='border-muted/50 bg-muted/10'>
													<CardHeader className='pb-2'>
														<CardDescription>Total Games</CardDescription>
													</CardHeader>
													<CardContent>
														<div className='text-3xl font-bold'>{totalGames}</div>
													</CardContent>
												</Card>
												<Card className='border-muted/50 bg-muted/10'>
													<CardHeader className='pb-2'>
														<CardDescription>Average Score</CardDescription>
													</CardHeader>
													<CardContent>
														<div className='text-3xl font-bold'>{avgScore}</div>
													</CardContent>
												</Card>
												<Card className='border-muted/50 bg-muted/10'>
													<CardHeader className='pb-2'>
														<CardDescription>Best Score</CardDescription>
													</CardHeader>
													<CardContent>
														<div className='text-3xl font-bold text-primary'>{bestScore}</div>
													</CardContent>
												</Card>
												<Card className='border-muted/50 bg-muted/10'>
													<CardHeader className='pb-2'>
														<CardDescription className='flex items-center gap-2'>
															<BookOpen className='h-4 w-4 text-indigo-500' />
															Most Played Topic
														</CardDescription>
													</CardHeader>
													<CardContent className='overflow-hidden'>
														<div className='text-lg font-bold text-indigo-500 truncate'>
															{gameStats?.mostPlayedTopic && gameStats.mostPlayedTopic !== 'None'
																? gameStats.mostPlayedTopic
																: 'None'}
														</div>
													</CardContent>
												</Card>
											</div>
										</CardContent>
									</Card>

									{/* History Table */}
									<Card className='border-muted bg-muted/20'>
										<CardHeader>
											<CardTitle className='flex items-center gap-2'>
												<Clock className='h-5 w-5' />
												Recent Games
											</CardTitle>
											<CardDescription>
												{records.length < totalGames
													? `Showing ${records.length} of ${totalGames} games`
													: `Your ${totalGames} trivia ${totalGames === 1 ? 'session' : 'sessions'}`}
											</CardDescription>
										</CardHeader>
										<CardContent className='overflow-x-auto'>
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>
															<div className='flex items-center gap-2'>
																<Calendar className='h-4 w-4' />
																Date
															</div>
														</TableHead>
														<TableHead>Topic</TableHead>
														<TableHead>Difficulty</TableHead>
														<TableHead>Score</TableHead>
														<TableHead>Questions</TableHead>
														<TableHead>Duration</TableHead>
														<TableHead className='w-10'></TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{records.map(record => (
														<TableRow key={record.id}>
															<TableCell className='font-medium'>
																{record.createdAt ? formatDate(record.createdAt) : '-'}
															</TableCell>
															<TableCell>{record.topic || 'General'}</TableCell>
															<TableCell>
																<Badge
																	variant={VariantBase.OUTLINE}
																	className={getDifficultyBadgeColor(record.difficulty || '')}
																>
																	{record.difficulty || 'Unknown'}
																</Badge>
															</TableCell>
															<TableCell>
																<span className='font-bold text-primary'>{record.score ?? 0}</span>
															</TableCell>
															<TableCell>
																{record.correctAnswers ?? 0}/{record.gameQuestionCount ?? 0}
															</TableCell>
															<TableCell>{formatDuration(record.timeSpent ?? 0)}</TableCell>
															<TableCell>
																<Button
																	variant={ButtonVariant.GHOST}
																	size={ButtonSize.ICON}
																	className='h-8 w-8 text-muted-foreground hover:text-destructive'
																	onClick={() => setDeleteId(record.id)}
																	disabled={deleteHistory.isPending}
																>
																	{deleteHistory.isPending && deleteId === record.id ? (
																		<Loader2 className='h-4 w-4 animate-spin' />
																	) : (
																		<Trash2 className='h-4 w-4' />
																	)}
																</Button>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</CardContent>
									</Card>

									{/* Delete Single Game Dialog */}
									<AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Delete Game Record</AlertDialogTitle>
												<AlertDialogDescription>
													Are you sure you want to delete this game record? This action cannot be undone.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<AlertDialogAction
													onClick={() => deleteId && handleDelete(deleteId)}
													className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
												>
													Delete
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>

									{/* Clear All Dialog */}
									<AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Clear All History</AlertDialogTitle>
												<AlertDialogDescription>
													This will permanently delete all {totalGames} game records. This action cannot be undone.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<AlertDialogAction
													onClick={handleClearAll}
													disabled={clearHistory.isPending}
													className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
												>
													{clearHistory.isPending ? (
														<>
															<Loader2 className='h-4 w-4 mr-2 animate-spin' />
															Clearing...
														</>
													) : (
														'Clear All'
													)}
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</>
							)}
						</TabsContent>
					)}

					<TabsContent value='leaderboard' className='mt-6 space-y-8'>
						{/* Leaderboard Rankings Section */}
						<Card className='border-primary/20 bg-primary/5'>
							<CardHeader>
								<CardTitle className='text-2xl font-bold flex items-center gap-2'>
									<Trophy className='h-6 w-6 text-primary' />
									Leaderboard Rankings
								</CardTitle>
								<CardDescription>See how you rank against other players worldwide</CardDescription>
							</CardHeader>
						</Card>

						{isAuthenticated && userRanking && (
							<Card className='border-primary/50 bg-primary/5'>
								<CardHeader className='pb-3'>
									<CardTitle className='text-lg flex items-center gap-2'>
										<User className='h-5 w-5 text-primary' />
										Your Ranking
									</CardTitle>
									<CardDescription>Your current position in the global leaderboard</CardDescription>
								</CardHeader>
								<CardContent>
									{rankLoading ? (
										<div className='flex items-center gap-4'>
											<Skeleton className='h-12 w-12 rounded-full' />
											<div className='space-y-2'>
												<Skeleton className='h-6 w-24' />
												<Skeleton className='h-4 w-32' />
											</div>
										</div>
									) : (
										<div className='flex items-center gap-4'>
											<div className='h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center'>
												<span className='text-2xl font-bold text-primary'>#{userRanking.rank}</span>
											</div>
											<div>
												<p className='text-2xl font-bold'>{userRanking.score?.toLocaleString() ?? 0} pts</p>
												<p className='text-sm text-muted-foreground'>
													Top {roundForDisplay(userRanking.percentile ?? 0)}% of {userRanking.totalUsers ?? 0} players
												</p>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						)}

						{/* Global Leaderboard Section */}
						<Card className='border-muted bg-muted/20'>
							<CardHeader>
								<CardTitle className='flex items-center gap-2 text-xl'>
									<Trophy className='h-6 w-6 text-yellow-500' />
									Global Leaderboard
								</CardTitle>
								<CardDescription>See how all players rank worldwide</CardDescription>
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
									</CardHeader>
									<CardContent className='overflow-hidden'>
										<LeaderboardTable entries={globalEntries} isLoading={globalLoading} />
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
									</CardHeader>
									<CardContent>
										<LeaderboardTable entries={weeklyEntries} isLoading={weeklyLoading} />
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					</TabsContent>
				</Tabs>
			</div>
		</motion.main>
	);
}
