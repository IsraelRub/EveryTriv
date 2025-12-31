import { forwardRef, useCallback, type MouseEvent } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';

import { AudioKey, ButtonSize, ButtonVariant } from '@/constants';
import { useAudio } from '@/hooks';
import type { ButtonProps } from '@/types';

export const buttonVariants = cva(
	'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				[ButtonVariant.DEFAULT]: 'bg-primary text-primary-foreground hover:bg-primary/90',
				[ButtonVariant.DESTRUCTIVE]: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
				[ButtonVariant.OUTLINE]: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
				[ButtonVariant.SECONDARY]: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
				[ButtonVariant.GHOST]: 'hover:bg-accent hover:text-accent-foreground',
			},
			size: {
				[ButtonSize.DEFAULT]: 'h-10 px-4 py-2',
				[ButtonSize.SM]: 'h-9 rounded-md px-3',
				[ButtonSize.LG]: 'h-11 rounded-md px-8',
				[ButtonSize.ICON]: 'h-10 w-10',
			},
		},
		defaultVariants: {
			variant: ButtonVariant.DEFAULT,
			size: ButtonSize.DEFAULT,
		},
	}
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, onClick, onMouseEnter, ...props }, ref) => {
		const audioService = useAudio();
		const Comp = asChild ? Slot : 'button';

		const handleClick = useCallback(
			(e: MouseEvent<HTMLButtonElement>) => {
				if (!asChild) {
					audioService.play(AudioKey.BUTTON_CLICK);
				}
				onClick?.(e);
			},
			[onClick, audioService, asChild]
		);

		return (
			<Comp
				className={buttonVariants({ variant, size, className })}
				ref={ref}
				onClick={handleClick}
				onMouseEnter={onMouseEnter}
				{...props}
			/>
		);
	}
);
Button.displayName = 'Button';
