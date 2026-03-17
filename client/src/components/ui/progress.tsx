import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { clamp } from '@shared/utils';

import { cn } from '@/utils';

export const Progress = forwardRef<
	ElementRef<typeof ProgressPrimitive.Root>,
	ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
	const safe = clamp(value ?? 0, 0, 100);
	return (
		<ProgressPrimitive.Root
			ref={ref}
			className={cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', className)}
			{...props}
		>
			<ProgressPrimitive.Indicator
				className='h-full w-full flex-1 bg-primary transition-all'
				style={{ transform: `translateX(-${100 - safe}%)` }}
			/>
		</ProgressPrimitive.Root>
	);
});
Progress.displayName = 'Progress';
