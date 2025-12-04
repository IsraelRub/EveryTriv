import { type ElementType } from 'react';

import { motion } from 'framer-motion';
import { BarChart3, BookOpen, Flame, GamepadIcon, Target, Timer, TrendingUp, Trophy } from 'lucide-react';

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Progress,
	Skeleton,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@/components';
import { useDifficultyStats, usePopularTopics, useUserAnalytics } from '@/hooks';
import { formatPlayTime } from '@/utils';

function StatCard({
	icon: Icon,
	label,
	value,
	subtext,
	color,
}: {
	icon: ElementType;
	label: string;
	value: string | number;
	subtext?: string;
	color: string;
}) {
	return (
		<Card>
			<CardContent className='pt-6'>
				<div className='flex items-center gap-4'>
					<div className={`p-3 rounded-lg ${color}`}>
						<Icon className='h-6 w-6 text-white' />
					</div>
					<div>
						<p className='text-2xl font-bold'>{value}</p>
						<p className='text-sm text-muted-foreground'>{label}</p>
						{subtext && <p className='text-xs text-muted-foreground'>{subtext}</p>}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function OverviewSkeleton() {
	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
			{[...Array(4)].map((_, i) => (
				<Card key={i}>
					<CardContent className='pt-6'>
						<div className='flex items-center gap-4'>
							<Skeleton className='h-12 w-12 rounded-lg' />
							<div className='space-y-2'>
								<Skeleton className='h-6 w-16' />
								<Skeleton className='h-4 w-24' />
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function TopicBar({ topic, count, maxCount }: { topic: string; count: number; maxCount: number }) {
	const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

	return (
		<div className='space-y-1'>
			<div className='flex justify-between text-sm'>
				<span className='font-medium'>{topic}</span>
				<span className='text-muted-foreground'>{count} games</span>
			</div>
			<Progress value={percentage} className='h-2' />
		</div>
	);
}

function DifficultyBar({
	difficulty,
	successRate,
	gamesPlayed,
	color,
}: {
	difficulty: string;
	successRate: number;
	gamesPlayed: number;
	color: string;
}) {
	return (
		<div className='space-y-1'>
			<div className='flex justify-between text-sm'>
				<span className='font-medium capitalize'>{difficulty}</span>
				<span className='text-muted-foreground'>
					{Math.round(successRate)}% success ({gamesPlayed} games)
				</span>
			</div>
			<Progress value={successRate} className={`h-2 ${color}`} />
		</div>
	);
}

export function AnalyticsView() {
	const { data: analytics, isLoading: analyticsLoading } = useUserAnalytics();
	const { data: topicsData, isLoading: topicsLoading } = usePopularTopics();
	const { data: difficultyData, isLoading: difficultyLoading } = useDifficultyStats();

	const gameStats = analytics?.game;
	const performanceStats = analytics?.performance;

	return (
		<motion.main
			role='main'
			aria-label='Analytics'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className='min-h-screen py-12 px-4'
		>
			<div className='max-w-7xl mx-auto space-y-8'>
				<div className='text-center'>
					<h1 className='text-4xl font-bold mb-2'>Analytics</h1>
					<p className='text-muted-foreground'>Track your performance over time</p>
				</div>

				<Tabs defaultValue='overview' className='w-full'>
					<TabsList className='grid w-full max-w-lg mx-auto grid-cols-3'>
						<TabsTrigger value='overview'>Overview</TabsTrigger>
						<TabsTrigger value='performance'>Performance</TabsTrigger>
						<TabsTrigger value='categories'>Categories</TabsTrigger>
					</TabsList>

					<TabsContent value='overview' className='mt-6 space-y-6'>
						{analyticsLoading ? (
							<OverviewSkeleton />
						) : (
							<>
								<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
									<StatCard
										icon={GamepadIcon}
										label='Total Games'
										value={gameStats?.totalGames || 0}
										color='bg-blue-500'
									/>
									<StatCard
										icon={Target}
										label='Success Rate'
										value={`${Math.round(gameStats?.successRate || 0)}%`}
										subtext={`${gameStats?.correctAnswers || 0}/${gameStats?.totalQuestionsAnswered || 0} correct`}
										color='bg-green-500'
									/>
									<StatCard
										icon={Trophy}
										label='Best Score'
										value={(gameStats?.bestScore || 0).toLocaleString()}
										color='bg-yellow-500'
									/>
									<StatCard
										icon={Timer}
										label='Total Play Time'
										value={formatPlayTime(gameStats?.totalPlayTime || 0, 'seconds')}
										color='bg-purple-500'
									/>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
									<Card>
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
												<span className='font-bold'>{Math.round(gameStats?.averageScore || 0)}</span>
											</div>
											<div className='flex justify-between items-center'>
												<span>Best Score</span>
												<span className='font-bold text-green-500'>{(gameStats?.bestScore || 0).toLocaleString()}</span>
											</div>
											<div className='flex justify-between items-center'>
												<span>Total Score</span>
												<span className='font-bold'>
													{((gameStats?.averageScore || 0) * (gameStats?.totalGames || 0)).toLocaleString()}
												</span>
											</div>
										</CardContent>
									</Card>

									<Card>
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
												<span className='font-bold text-orange-500'>{performanceStats?.streakDays || 0} days</span>
											</div>
											<div className='flex justify-between items-center'>
												<span>Best Streak</span>
												<span className='font-bold'>{performanceStats?.bestStreak || 0} days</span>
											</div>
											<div className='flex justify-between items-center'>
												<span>Improvement Rate</span>
												<span className='font-bold'>{Math.round(performanceStats?.improvementRate || 0)}%</span>
											</div>
										</CardContent>
									</Card>
								</div>
							</>
						)}
					</TabsContent>

					<TabsContent value='performance' className='mt-6'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<BarChart3 className='h-5 w-5' />
									Performance by Difficulty
								</CardTitle>
								<CardDescription>How you perform at different difficulty levels</CardDescription>
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
								) : difficultyData?.difficulties && Object.keys(difficultyData.difficulties).length > 0 ? (
									Object.entries(difficultyData.difficulties).map(([difficulty, stats], index) => (
										<DifficultyBar
											key={difficulty}
											difficulty={difficulty}
											successRate={stats.successRate || 0}
											gamesPlayed={stats.total}
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
									))
								) : (
									<div className='text-center py-8 text-muted-foreground'>
										<BarChart3 className='h-12 w-12 mx-auto mb-4 opacity-50' />
										<p>Play more games to see difficulty stats</p>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value='categories' className='mt-6'>
						<Card>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<BookOpen className='h-5 w-5' />
									Popular Topics
								</CardTitle>
								<CardDescription>Topics you play the most</CardDescription>
							</CardHeader>
							<CardContent className='space-y-6'>
								{topicsLoading ? (
									<div className='space-y-4'>
										{[...Array(5)].map((_, i) => (
											<div key={i} className='space-y-2'>
												<Skeleton className='h-4 w-full' />
												<Skeleton className='h-2 w-full' />
											</div>
										))}
									</div>
								) : topicsData?.topics && topicsData.topics.length > 0 ? (
									(() => {
										const maxCount = Math.max(...topicsData.topics.map(t => t.totalGames));
										return topicsData.topics
											.slice(0, 10)
											.map(topic => (
												<TopicBar key={topic.topic} topic={topic.topic} count={topic.totalGames} maxCount={maxCount} />
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
				</Tabs>
			</div>
		</motion.main>
	);
}
