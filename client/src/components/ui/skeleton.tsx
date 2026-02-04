import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/utils';

export const Skeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
	return <div ref={ref} className={cn('rounded-md bg-muted animate-pulse', className)} {...props} />;
});
Skeleton.displayName = 'Skeleton';

export const SkeletonText = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
	({ className, ...props }, ref) => {
		return <span ref={ref} className={cn('inline-block rounded-md bg-muted animate-pulse', className)} {...props} />;
	}
);
SkeletonText.displayName = 'SkeletonText';
