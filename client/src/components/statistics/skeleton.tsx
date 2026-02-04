import { AchievementCardVariant, SKELETON_HEIGHTS, SKELETON_WIDTHS } from '@/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton, SkeletonText } from '@/components';
import { TableRowsSkeleton } from '../ui/tableRowsSkeleton';
import { cn } from '@/utils';

export function LeaderboardSkeleton() {
	return (
		<div className='space-y-3 overflow-hidden'>
			{[...Array(5)].map((_, i) => (
				<div key={i} className='flex items-center gap-4 p-3 overflow-hidden'>
					<Skeleton className={`${SKELETON_HEIGHTS.ICON} ${SKELETON_WIDTHS.ICON} rounded-full max-w-full`} />
					<Skeleton
						className={`${SKELETON_HEIGHTS.ICON_LARGE} ${SKELETON_WIDTHS.ICON_LARGE} rounded-full max-w-full`}
					/>
					<div className='flex-1 space-y-2 overflow-hidden min-w-0'>
						<Skeleton className={`${SKELETON_HEIGHTS.TEXT} ${SKELETON_WIDTHS.TEXT_LARGE} max-w-full`} />
						<Skeleton className={`${SKELETON_HEIGHTS.TEXT_SMALL} ${SKELETON_WIDTHS.TEXT_SMALL} max-w-full`} />
					</div>
					<Skeleton className={`${SKELETON_HEIGHTS.TEXT_LARGE} ${SKELETON_WIDTHS.BADGE} max-w-full`} />
				</div>
			))}
		</div>
	);
}

export function PerformanceSkeleton() {
	return (
		<Card className='border-muted bg-muted/20'>
			<CardHeader>
				<CardTitle>
					<Skeleton className={`${SKELETON_HEIGHTS.TEXT_LARGE} ${SKELETON_WIDTHS.TEXT_LARGE}`} />
				</CardTitle>
				<CardDescription>
					<SkeletonText className={`${SKELETON_HEIGHTS.TEXT_SMALL} ${SKELETON_WIDTHS.TEXT_LARGE}`} />
				</CardDescription>
			</CardHeader>
			<CardContent className='space-y-8'>
				{/* Chart skeletons */}
				<div className='space-y-4'>
					<Skeleton className={`${SKELETON_HEIGHTS.TEXT} ${SKELETON_WIDTHS.FULL} max-w-xs mx-auto`} />
					<Skeleton className={`${SKELETON_HEIGHTS.CHART_SMALL} ${SKELETON_WIDTHS.FULL}`} />
				</div>
				<div className='space-y-4 border-t pt-8'>
					<Skeleton className={`${SKELETON_HEIGHTS.TEXT} ${SKELETON_WIDTHS.FULL} max-w-xs mx-auto`} />
					<Skeleton className={`${SKELETON_HEIGHTS.CHART_SMALL} ${SKELETON_WIDTHS.FULL}`} />
				</div>
				<div className='flex justify-center border-t pt-8'>
					<Skeleton className={`${SKELETON_HEIGHTS.CHART_LARGE} ${SKELETON_WIDTHS.FULL} max-w-2xl`} />
				</div>
			</CardContent>
		</Card>
	);
}

export function CategorySkeleton() {
	return (
		<Card className='border-muted bg-muted/20'>
			<CardHeader>
				<CardTitle>
					<Skeleton className={`${SKELETON_HEIGHTS.TEXT_LARGE} ${SKELETON_WIDTHS.TEXT_LARGE}`} />
				</CardTitle>
				<CardDescription>
					<SkeletonText className={`${SKELETON_HEIGHTS.TEXT_SMALL} ${SKELETON_WIDTHS.TEXT_LARGE}`} />
				</CardDescription>
			</CardHeader>
			<CardContent className='space-y-8 overflow-hidden'>
				{/* Badge skeleton */}
				<div className='flex justify-center'>
					<Skeleton className={`${SKELETON_HEIGHTS.ICON_LARGE} ${SKELETON_WIDTHS.ICON_LARGE} rounded-full`} />
				</div>
				{/* Chart skeleton */}
				<div className='flex justify-center border-t pt-8'>
					<Skeleton className={`${SKELETON_HEIGHTS.CHART_LARGE} ${SKELETON_WIDTHS.FULL} max-w-2xl`} />
				</div>
				{/* Bar chart skeleton */}
				<div className='space-y-4 border-t pt-8'>
					<Skeleton className={`${SKELETON_HEIGHTS.TEXT} ${SKELETON_WIDTHS.FULL} max-w-xs mx-auto`} />
					<Skeleton className={`${SKELETON_HEIGHTS.CHART} ${SKELETON_WIDTHS.FULL}`} />
				</div>
			</CardContent>
		</Card>
	);
}

export function HistorySkeleton() {
	return (
		<div className='space-y-6'>
			{/* Stats cards */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className={`${SKELETON_HEIGHTS.TEXT_SMALL} ${SKELETON_WIDTHS.TEXT_SMALL}`} />
						</CardHeader>
						<CardContent>
							<Skeleton className={`${SKELETON_HEIGHTS.TEXT_LARGE} ${SKELETON_WIDTHS.BADGE} mb-2`} />
							<Skeleton className={`${SKELETON_HEIGHTS.TEXT_SMALL} ${SKELETON_WIDTHS.TEXT_SMALL}`} />
						</CardContent>
					</Card>
				))}
			</div>
			{/* Table skeleton */}
			<Card>
				<CardHeader>
					<Skeleton className={`${SKELETON_HEIGHTS.TEXT_LARGE} ${SKELETON_WIDTHS.TEXT_LARGE}`} />
				</CardHeader>
				<CardContent>
					<TableRowsSkeleton rowCount={5} />
				</CardContent>
			</Card>
		</div>
	);
}

export function AchievementCardSkeleton({
	variant = AchievementCardVariant.DEFAULT,
	className,
}: {
	variant?: AchievementCardVariant;
	className?: string;
}) {
	switch (variant) {
		case AchievementCardVariant.DETAILED:
			return (
				<Card className={cn('border-l-4 border-l-yellow-500', className)}>
					<CardHeader className='pb-3'>
						<div className='flex items-center justify-between gap-2'>
							<div className='flex items-center gap-2'>
								<Skeleton className={`${SKELETON_HEIGHTS.ICON} ${SKELETON_WIDTHS.ICON} rounded`} />
								<Skeleton className={`${SKELETON_HEIGHTS.TEXT} ${SKELETON_WIDTHS.TEXT_LARGE} max-w-full`} />
							</div>
							<Skeleton className={`${SKELETON_HEIGHTS.BADGE} ${SKELETON_WIDTHS.BADGE} max-w-full`} />
						</div>
					</CardHeader>
					<CardContent className='space-y-2'>
						<Skeleton className={`${SKELETON_HEIGHTS.TEXT_SMALL} ${SKELETON_WIDTHS.TEXT_LARGE} max-w-full`} />
						<div className='flex items-center gap-2 flex-wrap'>
							<Skeleton className={`${SKELETON_HEIGHTS.BADGE} ${SKELETON_WIDTHS.BADGE} max-w-full`} />
							<Skeleton className={`${SKELETON_HEIGHTS.TEXT_SMALL} ${SKELETON_WIDTHS.TEXT} max-w-full`} />
						</div>
					</CardContent>
				</Card>
			);

		case AchievementCardVariant.COMPACT:
		case AchievementCardVariant.DEFAULT:
		default:
			return (
				<div className={cn('p-4 rounded-lg bg-primary/5 border border-primary/10 flex flex-col gap-3', className)}>
					<div className='flex items-start gap-3'>
						<Skeleton className={`${SKELETON_HEIGHTS.ICON} ${SKELETON_WIDTHS.ICON} rounded`} />
						<div className='flex-1 min-w-0 space-y-2'>
							<div className='flex items-start justify-between gap-2'>
								<Skeleton className={`${SKELETON_HEIGHTS.TEXT} ${SKELETON_WIDTHS.TEXT_LARGE} max-w-full`} />
								<Skeleton className={`${SKELETON_HEIGHTS.BADGE} ${SKELETON_WIDTHS.BADGE} max-w-full`} />
							</div>
							<Skeleton className={`${SKELETON_HEIGHTS.TEXT_SMALL} ${SKELETON_WIDTHS.TEXT} max-w-full`} />
							<Skeleton className={`${SKELETON_HEIGHTS.BADGE} ${SKELETON_WIDTHS.BADGE} max-w-full`} />
						</div>
					</div>
				</div>
			);
	}
}
