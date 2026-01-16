import { motion } from 'framer-motion';
import { BarChart3, TrendingUp } from 'lucide-react';

import { TimePeriod } from '@shared/constants';

import { StatCardVariant } from '@/constants';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	DistributionChart,
	StatCard,
	TrendChart,
} from '@/components';
import { useGlobalStats, useGlobalTrends } from '@/hooks';
import type { PlatformTrendsSectionProps } from '@/types';

export function PlatformTrendsSection({ stats, statsLoading }: PlatformTrendsSectionProps) {
	const { data: globalStats } = useGlobalStats();
	const { data: globalTrends, isLoading: trendsLoading } = useGlobalTrends({ groupBy: TimePeriod.DAILY, limit: 30 });

	return (
		<div className='space-y-8'>
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
		</div>
	);
}
