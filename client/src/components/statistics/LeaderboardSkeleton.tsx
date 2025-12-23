import { Skeleton } from '@/components';

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
