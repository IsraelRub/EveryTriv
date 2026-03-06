import { memo } from 'react';
import { Gauge } from 'lucide-react';

import { CHART_HEIGHTS } from '@/constants';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	DifficultyOverviewChart,
	PerformanceSkeleton,
} from '@/components';
import type { PerformanceAnalysisProps } from '@/types';

export const PerformanceAnalysis = memo(function PerformanceAnalysis({
	mainData,
	isLoading,
	showPersonalStats = false,
}: PerformanceAnalysisProps) {
	if (isLoading) {
		return (
			<div className='space-y-8'>
				<PerformanceSkeleton />
			</div>
		);
	}

	const hasData = mainData && Object.keys(mainData).length > 0;
	if (!hasData) {
		return null;
	}

	return (
		<div className='space-y-8'>
			<Card className='card-muted-tint'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Gauge className='h-5 w-5 text-primary' />
						{showPersonalStats ? 'Your Performance by Difficulty' : 'Performance by Difficulty'}
					</CardTitle>
					<CardDescription>
						{showPersonalStats
							? 'Bar length = questions answered. Color = success rate (red → green). Hover for details.'
							: 'Bar length = games played. Color = success rate (red → green). Hover for details.'}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						<DifficultyOverviewChart
							difficultyData={mainData}
							height={CHART_HEIGHTS.LARGE}
							valueLabel={showPersonalStats ? 'Questions Answered' : 'Games Played'}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
});
