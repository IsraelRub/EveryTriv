import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva } from 'class-variance-authority';

import { AvatarSize, AvatarVariant } from '@/constants';
import type { AvatarProps } from '@/types';
import { cn } from '@/utils';

const avatarVariants = cva('relative flex shrink-0 overflow-hidden rounded-full', {
	variants: {
		size: {
			[AvatarSize.SM]: 'h-6 w-6',
			[AvatarSize.NAV]: 'h-9 w-9',
			[AvatarSize.MD]: 'h-10 w-10',
			[AvatarSize.LG]: 'h-12 w-12',
			[AvatarSize.XL]: 'h-20 w-20',
			[AvatarSize.FULL]: 'h-full w-full',
		},
		variant: {
			[AvatarVariant.DEFAULT]: '',
			[AvatarVariant.ELEVATED]: 'border-2 border-background shadow-lg',
			[AvatarVariant.RING]: 'ring-2 ring-muted-foreground/50',
			[AvatarVariant.PLACEHOLDER]: 'bg-muted flex items-center justify-center',
		},
		pointerEventsNone: {
			true: 'pointer-events-none',
			false: '',
		},
	},
	defaultVariants: {
		size: AvatarSize.MD,
		variant: AvatarVariant.DEFAULT,
		pointerEventsNone: false,
	},
});

export const Avatar = forwardRef<ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>(
	({ size = AvatarSize.MD, variant = AvatarVariant.DEFAULT, pointerEventsNone = false, ...props }, ref) => (
		<AvatarPrimitive.Root ref={ref} className={avatarVariants({ size, variant, pointerEventsNone })} {...props} />
	)
);
Avatar.displayName = 'Avatar';

export const AvatarImage = forwardRef<
	ElementRef<typeof AvatarPrimitive.Image>,
	ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
	<AvatarPrimitive.Image ref={ref} className={cn('aspect-square h-full w-full object-cover', className)} {...props} />
));
AvatarImage.displayName = 'AvatarImage';

export const AvatarFallback = forwardRef<
	ElementRef<typeof AvatarPrimitive.Fallback>,
	ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
	<AvatarPrimitive.Fallback
		ref={ref}
		className={cn('flex h-full w-full items-center justify-center rounded-full bg-muted', className)}
		{...props}
	/>
));
AvatarFallback.displayName = 'AvatarFallback';
