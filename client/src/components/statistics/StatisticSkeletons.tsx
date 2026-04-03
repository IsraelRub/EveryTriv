import { SKELETON_PLACEHOLDER_COUNTS, SkeletonVariant } from '@/constants';
import { repeat } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components';

export function LeaderboardSkeleton() {
	return (
		<div className='space-y-3 overflow-hidden'>
			{repeat(SKELETON_PLACEHOLDER_COUNTS.LIST, i => (
				<div key={i} className='flex items-center gap-4 p-3 overflow-hidden'>
					<Skeleton variant={SkeletonVariant.Icon} className='rounded-full max-w-full' />
					<Skeleton variant={SkeletonVariant.IconLarge} className='rounded-full max-w-full' />
					<div className='flex-1 space-y-2 overflow-hidden min-w-0'>
						<Skeleton variant={SkeletonVariant.TextLine} className='max-w-full' />
						<Skeleton variant={SkeletonVariant.TextSmall} className='max-w-full' />
					</div>
					<Skeleton variant={SkeletonVariant.Badge} className='max-w-full' />
				</div>
			))}
		</div>
	);
}

export function PerformanceSkeleton() {
	return (
		<Card className='card-muted-tint'>
			<CardHeader>
				<CardTitle>
					<Skeleton variant={SkeletonVariant.TextLarge} />
				</CardTitle>
				<CardDescription>
					<Skeleton variant={SkeletonVariant.TextSmallLine} inline />
				</CardDescription>
			</CardHeader>
			<CardContent className='space-y-8'>
				<div className='space-y-4'>
					<Skeleton variant={SkeletonVariant.Label} className='max-w-xs mx-auto' />
					<Skeleton variant={SkeletonVariant.ChartSmall} />
				</div>
				<div className='space-y-4 border-t pt-8'>
					<Skeleton variant={SkeletonVariant.Label} className='max-w-xs mx-auto' />
					<Skeleton variant={SkeletonVariant.ChartSmall} />
				</div>
				<div className='flex justify-center border-t pt-8'>
					<Skeleton variant={SkeletonVariant.ChartLarge} className='max-w-2xl' />
				</div>
			</CardContent>
		</Card>
	);
}

export function CategorySkeleton() {
	return (
		<Card className='card-muted-tint'>
			<CardHeader>
				<CardTitle>
					<Skeleton variant={SkeletonVariant.TextLarge} />
				</CardTitle>
				<CardDescription>
					<Skeleton variant={SkeletonVariant.TextSmallLine} inline />
				</CardDescription>
			</CardHeader>
			<CardContent className='space-y-8 overflow-hidden'>
				<div className='flex justify-center'>
					<Skeleton variant={SkeletonVariant.IconLarge} className='rounded-full' />
				</div>
				<div className='flex justify-center border-t pt-8'>
					<Skeleton variant={SkeletonVariant.ChartLarge} className='max-w-2xl' />
				</div>
				<div className='space-y-4 border-t pt-8'>
					<Skeleton variant={SkeletonVariant.Label} className='max-w-xs mx-auto' />
					<Skeleton variant={SkeletonVariant.Chart} />
				</div>
			</CardContent>
		</Card>
	);
}

export function HistorySkeleton() {
	return (
		<div className='space-y-6'>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
				{repeat(SKELETON_PLACEHOLDER_COUNTS.CARDS, i => (
					<Card key={i}>
						<CardHeader>
							<Skeleton variant={SkeletonVariant.TextSmall} />
						</CardHeader>
						<CardContent>
							<Skeleton variant={SkeletonVariant.Badge} className='mb-2' />
							<Skeleton variant={SkeletonVariant.TextSmall} />
						</CardContent>
					</Card>
				))}
			</div>
			<Card>
				<CardHeader>
					<Skeleton variant={SkeletonVariant.TextLarge} />
				</CardHeader>
				<CardContent>
					<div className='space-y-3'>
						<Skeleton variant={SkeletonVariant.TableRow} count={SKELETON_PLACEHOLDER_COUNTS.LIST} />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
