import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';

import { VariantBase } from '@/constants';
import type { BadgeProps } from '@/types';
import { cn } from '@/utils';

export const badgeVariants = cva(
	'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
	{
		variants: {
			variant: {
				[VariantBase.DEFAULT]: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
				[VariantBase.DESTRUCTIVE]:
					'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90',
				[VariantBase.MINIMAL]: 'border-transparent bg-transparent hover:bg-accent hover:text-accent-foreground',
				[VariantBase.OUTLINE]: 'text-foreground',
				[VariantBase.SECONDARY]: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
				[VariantBase.STATIC]: 'border-transparent bg-secondary text-secondary-foreground cursor-default',
			},
		},
		defaultVariants: { variant: VariantBase.DEFAULT },
	}
);

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(({ className, variant, ...props }, ref) => {
	return <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
});
Badge.displayName = 'Badge';
