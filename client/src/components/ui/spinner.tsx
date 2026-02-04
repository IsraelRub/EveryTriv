import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { SpinnerSize } from '@/constants';
import type { SpinnerProps } from '@/types';
import { cn } from '@/utils';

export const spinnerSizeVariants = cva('', {
	variants: {
		size: {
			[SpinnerSize.SM]: 'h-4 w-4',
			[SpinnerSize.MD]: 'h-5 w-5',
			[SpinnerSize.LG]: 'h-6 w-6',
			[SpinnerSize.XL]: 'h-12 w-12',
			[SpinnerSize.FULL]: 'h-16 w-16',
		},
	},
	defaultVariants: {
		size: SpinnerSize.MD,
	},
});

export const Spinner = forwardRef<SVGSVGElement, SpinnerProps>((props, ref) => {
	const { size, className, ...svgProps } = props;
	return (
		<Loader2
			ref={ref}
			className={cn(spinnerSizeVariants({ size: size ?? SpinnerSize.MD }), 'animate-spin', className)}
			{...svgProps}
		/>
	);
});
Spinner.displayName = 'Spinner';
