import { motion } from 'framer-motion';
import { Activity, GamepadIcon, TrendingUp } from 'lucide-react';

import { TIME_DURATIONS_SECONDS } from '@shared/constants';

import { ANIMATION_DELAYS, StatCardVariant, TextColor } from '@/constants';
import {
	GameStatisticsCard,
	PerformanceAnalysis,
	PlatformTrendsSection,
	StatCard,
} from '@/components';
import { useGameStatistics, useGlobalDifficultyStats, useRealTimeAnalytics } from '@/hooks';

export function AdminPerformanceTab() {
	const { data: globalStats, isLoading: statsLoading } = useRealTimeAnalytics();
	const { data: globalDifficultyStats, isLoading: difficultyLoading } = useGlobalDifficultyStats();
	const { data: gameStatistics, isLoading: gameStatisticsLoading } = useGameStatistics();

	const platformStats = [
		{
			icon: GamepadIcon,
			label: 'Average Games',
			value: globalStats?.averageGames ?? 0,
			color: TextColor.GREEN_500,
			countUp: true,
		},
		{
			icon: Activity,
			label: 'Average Game Time',
			value: Math.round((globalStats?.averageGameTime ?? 0) / TIME_DURATIONS_SECONDS.MINUTE),
			suffix: 'm',
			color: TextColor.YELLOW_500,
			countUp: true,
		},
		{
			icon: TrendingUp,
			label: 'Consistency',
			value: globalStats?.consistency ?? 0,
			suffix: '%',
			color: TextColor.PURPLE_500,
			countUp: true,
		},
	];

	return (
		<>
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6'>
				{platformStats.map((stat, index) => (
					<motion.div
						key={stat.label}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * ANIMATION_DELAYS.STAGGER_NORMAL }}
					>
						<StatCard {...stat} isLoading={statsLoading} variant={StatCardVariant.VERTICAL} />
					</motion.div>
				))}
			</div>
			<GameStatisticsCard
				data={gameStatistics}
				isLoading={gameStatisticsLoading}
			/>
			<PlatformTrendsSection statsLoading={statsLoading} />
			<PerformanceAnalysis mainData={globalDifficultyStats} isLoading={difficultyLoading} />
		</>
	);
}
