import { Skeleton } from '@/components';

export function ProfileSkeleton() {
	return (
		<div className='space-y-6 overflow-hidden'>
			<div className='flex items-center gap-4 overflow-hidden'>
				<Skeleton className='h-20 w-20 rounded-full max-w-full' />
				<div className='space-y-2 overflow-hidden flex-1 min-w-0'>
					<Skeleton className='h-6 w-48 max-w-full' />
					<Skeleton className='h-4 w-32 max-w-full' />
				</div>
			</div>
			<div className='grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden'>
				{[...Array(6)].map((_, i) => (
					<Skeleton key={i} className='h-24 rounded-lg max-w-full' />
				))}
			</div>
		</div>
	);
}
