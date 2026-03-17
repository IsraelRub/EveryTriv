import { forwardRef, useCallback, type FocusEvent } from 'react';
import { cva } from 'class-variance-authority';

import { AudioKey } from '@/constants';
import type { InputProps } from '@/types';
import { audioService } from '@/services';
import { cn } from '@/utils';

const inputVariants = cva(
	'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
	{
		variants: {
			error: {
				true: 'border-destructive focus-visible:ring-destructive',
				false: '',
			},
		},
		defaultVariants: {
			error: false,
		},
	}
);

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, type, onFocus, error = false, ...props }, ref) => {
		const handleFocus = useCallback(
			(e: FocusEvent<HTMLInputElement>) => {
				audioService.play(AudioKey.INPUT);
				onFocus?.(e);
			},
			[onFocus]
		);

		return (
			<input
				type={type}
				className={cn(inputVariants({ error: !!error }), className)}
				ref={ref}
				onFocus={handleFocus}
				{...props}
			/>
		);
	}
);
Input.displayName = 'Input';
