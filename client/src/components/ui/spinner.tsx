import { cva } from 'class-variance-authority';
import { Loader2, RefreshCw } from 'lucide-react';

import { SpinnerSize, SpinnerVariant } from '@/constants';
import { cn } from '@/utils';
import type { SpinnerProps } from '@/types';

export const spinnerVariants = cva('', {
	variants: {
		variant: {
			[SpinnerVariant.FULL_SCREEN]: 'spinner-pulsing',
			[SpinnerVariant.BUTTON]: '',
			[SpinnerVariant.REFRESH]: '',
		},
		size: {
			[SpinnerSize.SM]: 'h-4 w-4',
			[SpinnerSize.MD]: 'h-5 w-5',
			[SpinnerSize.LG]: 'h-6 w-6',
			[SpinnerSize.XL]: 'h-12 w-12',
			[SpinnerSize.FULL]: 'h-16 w-16',
		},
	},
	defaultVariants: {
		variant: SpinnerVariant.BUTTON,
		size: SpinnerSize.MD,
	},
});

/**
 * Spinner Component
 * @description Unified spinner component for loading states throughout the application
 */
export function Spinner({ variant = SpinnerVariant.BUTTON, size = SpinnerSize.MD, className }: SpinnerProps) {
	switch (variant) {
		
		case SpinnerVariant.FULL_SCREEN:
			return <div className={cn(spinnerVariants({ variant, size }), className)} />;

		case SpinnerVariant.BUTTON:
			return <Loader2 className={cn(spinnerVariants({ variant, size }), 'animate-spin', className)} />;
				
		case SpinnerVariant.REFRESH:
			return <RefreshCw className={cn(spinnerVariants({ variant, size }), 'animate-spin', className)} />;

		default:
			throw new Error(`Invalid spinner variant: ${variant}`);
	}
}
