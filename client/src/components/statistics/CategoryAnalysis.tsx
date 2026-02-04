import { memo } from 'react';
import { BookOpen } from 'lucide-react';

import { CHART_HEIGHTS } from '@/constants';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CategorySkeleton,
	EmptyState,
	TopicsDistributionChart,
} from '@/components';
import type { CategoryAnalysisProps } from '@/types';

export const CategoryAnalysis = memo(function CategoryAnalysis({
	topicsData,
	isLoading,
	showPersonalStats = false,
	maxItems = 8,
	minPercentage = 1,
}: CategoryAnalysisProps) {
	const effectiveMinPercentage = minPercentage === 0 ? undefined : minPercentage;

	if (isLoading) {
		return (
			<div className='space-y-8'>
				<CategorySkeleton />
			</div>
		);
	}

	return (
		<div className='space-y-8'>
			{/* Topic Analysis - Combined */}
			{(showPersonalStats || (topicsData && topicsData.length > 0)) && (
				<Card className='border-muted bg-muted/20'>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<BookOpen className='h-5 w-5' />
							{showPersonalStats ? 'Your Topics' : 'Topic Details'}
						</CardTitle>
						<CardDescription>
							{showPersonalStats
								? 'Questions answered per topic and percentage distribution'
								: 'Number of games played per topic and percentage distribution'}
						</CardDescription>
					</CardHeader>
					<CardContent className='overflow-hidden'>
						{topicsData && topicsData.length > 0 ? (
							<div className='min-w-0'>
								<TopicsDistributionChart
									topicsData={topicsData}
									maxItems={maxItems}
									minPercentage={effectiveMinPercentage}
									height={CHART_HEIGHTS.LARGE}
									valueLabel={showPersonalStats ? 'Questions Answered' : 'Games Played'}
									centerPrimaryLabel={showPersonalStats ? 'Total Questions' : undefined}
								/>
							</div>
						) : (
							<EmptyState data='topic statistics' />
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
});
