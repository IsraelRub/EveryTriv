import { BarChart3, TrendingUp } from 'lucide-react';

import { isGameDifficulty } from '@shared/validation';

import {
	Bar,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	DistributionChart,
	Skeleton,
} from '@/components';
import { useGlobalDifficultyStats } from '@/hooks';

export function PerformanceAnalysisSection() {
	const { data: globalDifficultyStats, isLoading: difficultyLoading } = useGlobalDifficultyStats();

	return (
		<div className='space-y-8'>
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
								return (
									<Bar
										key={difficulty}
										difficulty={difficulty}
										successRate={stats?.successRate ?? 0}
										gamesPlayed={stats?.total ?? 0}
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
		</div>
	);
}
