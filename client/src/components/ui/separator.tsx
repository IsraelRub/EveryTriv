import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cva } from 'class-variance-authority';

import { cn } from '@/utils';

const separatorVariants = cva('shrink-0 bg-border', {
	variants: {
		orientation: {
			horizontal: 'h-[1px] w-full',
			vertical: 'h-full w-[1px]',
		},
	},
	defaultVariants: {
		orientation: 'horizontal',
	},
});

export const Separator = forwardRef<
	ElementRef<typeof SeparatorPrimitive.Root>,
	ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
	<SeparatorPrimitive.Root
		ref={ref}
		decorative={decorative}
		orientation={orientation}
		className={cn(separatorVariants({ orientation }), className)}
		{...props}
	/>
));
Separator.displayName = 'Separator';
