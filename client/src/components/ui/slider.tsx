import { forwardRef, type ElementRef } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import type { SliderProps } from '@/types';
import { cn } from '@/utils';

const trackSizes = {
	default: 'h-2',
	sm: 'h-1',
} as const;

const thumbSizes = {
	default: 'h-5 w-5',
	sm: 'h-3 w-3',
} as const;

export const Slider = forwardRef<ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
	({ className, size = 'default', ...props }, ref) => (
		<SliderPrimitive.Root
			ref={ref}
			className={cn('relative flex w-full touch-none select-none items-center', className)}
			{...props}
		>
			<SliderPrimitive.Track
				className={cn('relative w-full grow overflow-hidden rounded-full bg-secondary', trackSizes[size])}
			>
				<SliderPrimitive.Range className='absolute h-full bg-primary' />
			</SliderPrimitive.Track>
			<SliderPrimitive.Thumb
				className={cn(
					'block rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
					thumbSizes[size]
				)}
			/>
		</SliderPrimitive.Root>
	)
);
Slider.displayName = 'Slider';
