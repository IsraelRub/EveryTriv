import { memo } from 'react';

import { SKELETON_HEIGHTS, SKELETON_WIDTHS } from '@/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components';
import type { ChartCardProps } from '@/types';
import { cn } from '@/utils';

export const ChartCard = memo(function ChartCard({
	title,
	description,
	isLoading,
	data,
	children,
	className,
}: ChartCardProps) {
	const isEmpty = !isLoading && (!data || (Array.isArray(data) && data.length === 0));

	if (isLoading) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
				<CardContent>
					<Skeleton className={`${SKELETON_HEIGHTS.CHART} ${SKELETON_WIDTHS.FULL}`} />
				</CardContent>
			</Card>
		);
	}

	if (isEmpty) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
				<CardContent>
					<div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
						<p>No data available</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className={cn('animate-fade-in-up-simple', className)}>
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
				<CardContent>{children}</CardContent>
			</Card>
		</div>
	);
});
