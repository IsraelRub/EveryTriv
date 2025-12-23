/**
 * Game Statistics Card Component
 *
 * @module GameStatisticsCard
 * @description Component for displaying game statistics in admin dashboard
 */
import { Activity, BarChart3, GamepadIcon, RefreshCw, Target, Trophy } from 'lucide-react';

import { roundForDisplay } from '@shared/utils';

import { ButtonSize, ButtonVariant, StatCardVariant, TextColor } from '@/constants';

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	DistributionChart,
	Skeleton,
	StatCard,
} from '@/components';

import type { GameStatisticsCardProps } from '@/types';

/**
 * Component for displaying game statistics
 * @param props Component props
 * @returns Game statistics card component
 */
export function GameStatisticsCard({ data, isLoading = false, onRefresh }: GameStatisticsCardProps) {
	const stats = [
		{
			icon: GamepadIcon,
			label: 'Total Games',
			value: data?.totalGames ?? 0,
			color: TextColor.BLUE_500,
		},
		{
			icon: Trophy,
			label: 'Best Score',
			value: data?.bestScore ?? 0,
			color: TextColor.YELLOW_500,
		},
		{
			icon: Target,
			label: 'Average Score',
			value: roundForDisplay(data?.averageScore ?? 0),
			color: TextColor.GREEN_500,
		},
		{
			icon: BarChart3,
			label: 'Accuracy',
			value: `${roundForDisplay(data?.accuracy ?? 0)}%`,
			color: TextColor.PURPLE_500,
		},
		{
			icon: Activity,
			label: 'Active Players (24h)',
			value: data?.activePlayers24h ?? 0,
			color: TextColor.ORANGE_500,
		},
		{
			icon: GamepadIcon,
			label: 'Questions Answered',
			value: data?.totalQuestionsAnswered ?? 0,
			color: TextColor.CYAN_500,
		},
	];

	return (
		<div className='space-y-6'>
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle className='flex items-center gap-2'>
								<BarChart3 className='h-5 w-5' />
								Game Statistics
							</CardTitle>
							<CardDescription>Overview of all game-related statistics</CardDescription>
						</div>
						{onRefresh && (
							<Button variant={ButtonVariant.OUTLINE} size={ButtonSize.SM} onClick={onRefresh} disabled={isLoading}>
								<RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
								Refresh
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							{[...Array(6)].map((_, i) => (
								<Skeleton key={i} className='h-24 w-full' />
							))}
						</div>
					) : (
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
							{stats.map(stat => (
								<StatCard key={stat.label} {...stat} isLoading={isLoading} variant={StatCardVariant.VERTICAL} />
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{data && (
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					<Card>
						<CardHeader>
							<CardTitle>Topics Distribution</CardTitle>
							<CardDescription>Games played by topic</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<Skeleton className='h-[300px] w-full' />
							) : Object.keys(data.topics).length > 0 ? (
								<DistributionChart
									data={Object.entries(data.topics)
										.slice(0, 10)
										.map(([topic, count]) => ({
											name: topic,
											value: count,
										}))}
									isLoading={false}
									height={300}
									xAxisLabel='Topic'
									yAxisLabel='Games'
									valueLabel='Games'
									color='hsl(var(--primary))'
								/>
							) : (
								<div className='text-center py-8 text-muted-foreground'>
									<BarChart3 className='h-12 w-12 mx-auto mb-4 opacity-50' />
									<p>No topic statistics available</p>
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Difficulty Distribution</CardTitle>
							<CardDescription>Games played by difficulty level</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<Skeleton className='h-[300px] w-full' />
							) : Object.keys(data.difficultyDistribution).length > 0 ? (
								<DistributionChart
									data={Object.entries(data.difficultyDistribution).map(([difficulty, count]) => ({
										name: difficulty,
										value: count,
									}))}
									isLoading={false}
									height={300}
									xAxisLabel='Difficulty'
									yAxisLabel='Games'
									valueLabel='Games'
									color='hsl(var(--primary))'
								/>
							) : (
								<div className='text-center py-8 text-muted-foreground'>
									<BarChart3 className='h-12 w-12 mx-auto mb-4 opacity-50' />
									<p>No difficulty statistics available</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
