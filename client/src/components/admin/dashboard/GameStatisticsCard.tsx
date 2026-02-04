import { Activity, BarChart3, FileQuestion, GamepadIcon, Target, Trophy } from 'lucide-react';

import { formatForDisplay } from '@shared/utils';

import { StatCardVariant, TextColor } from '@/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, StatCard } from '@/components';
import type { GameStatisticsCardProps } from '@/types';

export function GameStatisticsCard({ data, isLoading = false }: GameStatisticsCardProps) {
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
			value: formatForDisplay(data?.averageScore ?? 0),
			color: TextColor.GREEN_500,
		},
		{
			icon: BarChart3,
			label: 'Accuracy',
			value: `${formatForDisplay(data?.accuracy ?? 0)}%`,
			color: TextColor.PURPLE_500,
		},
		{
			icon: Activity,
			label: 'Active Players (24h)',
			value: data?.activePlayers24h ?? 0,
			color: TextColor.ORANGE_500,
		},
		{
			icon: FileQuestion,
			label: 'Questions Answered',
			value: data?.totalQuestionsAnswered ?? 0,
			color: TextColor.CYAN_500,
		},
	];

	return (
		<Card>
			<CardHeader>
				<div>
					<CardTitle className='flex items-center gap-2'>
						<BarChart3 className='h-5 w-5' />
						Game Statistics
					</CardTitle>
					<CardDescription>
						Overview of game metrics. See Topics and Performance tabs for distribution charts.
					</CardDescription>
				</div>
			</CardHeader>
			<CardContent>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
					{stats.map(stat => (
						<StatCard
							key={stat.label}
							{...stat}
							isLoading={isLoading}
							variant={StatCardVariant.VERTICAL}
							countUp={typeof stat.value === 'number'}
						/>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
