import { memo } from 'react';
import { BarChart3 } from 'lucide-react';

import { CHART_HEIGHTS } from '@/constants';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	DifficultyOverviewChart,
	EmptyState,
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

	return (
		<div className='space-y-8'>
			<Card className='border-muted bg-muted/20'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<BarChart3 className='h-5 w-5' />
						{showPersonalStats ? 'Your Performance by Difficulty' : 'Performance by Difficulty'}
					</CardTitle>
					<CardDescription>
						{showPersonalStats
							? 'Bar length = questions answered. Color = success rate (red → green). Hover for details.'
							: 'Bar length = games played. Color = success rate (red → green). Hover for details.'}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{hasData && (
						<div className='space-y-4'>
							<DifficultyOverviewChart
								difficultyData={mainData}
								height={CHART_HEIGHTS.LARGE}
								valueLabel={showPersonalStats ? 'Questions Answered' : 'Games Played'}
							/>
						</div>
					)}
					{!hasData && <EmptyState data='difficulty statistics' />}
				</CardContent>
			</Card>
		</div>
	);
});
