import { memo } from 'react';

import { SkeletonVariant } from '@/constants';
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

	return (
		<div className={cn(!isLoading && !isEmpty && 'animate-fade-in-up-simple', className)}>
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<Skeleton variant={SkeletonVariant.Chart} />
					) : isEmpty ? (
						<div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
							<p>No data available</p>
						</div>
					) : (
						children
					)}
				</CardContent>
			</Card>
		</div>
	);
});
