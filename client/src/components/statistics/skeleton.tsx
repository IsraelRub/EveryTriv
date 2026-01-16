import { Card, CardContent, Skeleton } from '@/components';

export function LeaderboardSkeleton() {
	return (
		<div className='space-y-3 overflow-hidden'>
			{[...Array(5)].map((_, i) => (
				<div key={i} className='flex items-center gap-4 p-3 overflow-hidden'>
					<Skeleton className='h-8 w-8 rounded-full max-w-full' />
					<Skeleton className='h-10 w-10 rounded-full max-w-full' />
					<div className='flex-1 space-y-2 overflow-hidden min-w-0'>
						<Skeleton className='h-4 w-32 max-w-full' />
						<Skeleton className='h-3 w-20 max-w-full' />
					</div>
					<Skeleton className='h-6 w-16 max-w-full' />
				</div>
			))}
		</div>
	);
}

export function OverviewSkeleton() {
	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
			{[...Array(4)].map((_, i) => (
				<Card key={i}>
					<CardContent className='pt-6 overflow-hidden'>
						<div className='flex items-center gap-4 overflow-hidden'>
							<Skeleton className='h-12 w-12 rounded-lg max-w-full' />
							<div className='space-y-2 overflow-hidden flex-1 min-w-0'>
								<Skeleton className='h-6 w-16 max-w-full' />
								<Skeleton className='h-4 w-24 max-w-full' />
							</div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
