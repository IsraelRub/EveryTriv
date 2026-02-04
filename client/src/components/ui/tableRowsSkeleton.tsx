import { memo } from 'react';

import { SKELETON_HEIGHTS, SKELETON_WIDTHS } from '@/constants';
import { cn } from '@/utils';
import { Skeleton } from './skeleton';

export interface TableRowsSkeletonProps {
	rowCount?: number;
	className?: string;
}

export const TableRowsSkeleton = memo(function TableRowsSkeleton({
	rowCount = 5,
	className,
}: TableRowsSkeletonProps) {
	return (
		<div className={cn('space-y-3', className)}>
			{[...Array(rowCount)].map((_, i) => (
				<Skeleton key={i} className={`${SKELETON_HEIGHTS.TABLE_ROW} ${SKELETON_WIDTHS.FULL}`} />
			))}
		</div>
	);
});
