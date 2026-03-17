import { ForwardedRef, forwardRef, useCallback } from 'react';
import { cva } from 'class-variance-authority';

import { SkeletonVariant } from '@/constants';
import type { SkeletonProps } from '@/types';
import { cn, repeat } from '@/utils';

const skeletonVariants = cva('rounded-md bg-muted animate-pulse', {
	variants: {
		size: {
			[SkeletonVariant.Icon]: 'h-8 w-8',
			[SkeletonVariant.IconLarge]: 'h-12 w-12',
			[SkeletonVariant.IconNarrow]: 'h-8 w-20',
			[SkeletonVariant.Text]: 'h-4 w-24',
			[SkeletonVariant.TextDescription]: 'h-4 w-48',
			[SkeletonVariant.TextLine]: 'h-4 w-32',
			[SkeletonVariant.TextWithSmallWidth]: 'h-4 w-20',
			[SkeletonVariant.TextSmall]: 'h-3 w-20',
			[SkeletonVariant.TextSmallLine]: 'h-3 w-32',
			[SkeletonVariant.TextLarge]: 'h-6 w-32',
			[SkeletonVariant.TextLargeNarrow]: 'h-6 w-24',
			[SkeletonVariant.Badge]: 'h-6 w-16',
			[SkeletonVariant.Card]: 'h-24 w-full',
			[SkeletonVariant.Row]: 'h-16 w-full',
			[SkeletonVariant.TableRow]: 'h-12 w-full',
			[SkeletonVariant.Chart]: 'h-[300px] w-full',
			[SkeletonVariant.ChartSmall]: 'h-[250px] w-full',
			[SkeletonVariant.ChartLarge]: 'h-[350px] w-full',
			[SkeletonVariant.Label]: 'h-4 w-full',
			[SkeletonVariant.Input]: 'h-10 w-32',
			[SkeletonVariant.InputMedium]: 'h-10 w-40',
			[SkeletonVariant.InputSmall]: 'h-10 w-20',
			[SkeletonVariant.InputFull]: 'h-10 w-full',
			[SkeletonVariant.BlockSm]: 'h-20 w-full',
			[SkeletonVariant.BlockTall]: 'h-32 w-full',
			[SkeletonVariant.BlockLarge]: 'h-48 w-full',
			[SkeletonVariant.BlockXl]: 'h-96 w-full',
		},
	},
	defaultVariants: { size: undefined },
});

function assignRef(el: HTMLDivElement | HTMLSpanElement | null, ref: ForwardedRef<HTMLElement>): void {
	if (typeof ref === 'function') ref(el);
	else if (ref) ref.current = el;
}

export const Skeleton = forwardRef<HTMLElement, SkeletonProps>(
	({ className, variant, inline = false, count = 1, ...props }, ref) => {
		const resolvedClassName = cn(inline && 'inline-block', skeletonVariants({ size: variant }), className);
		const refCallback = useCallback((el: HTMLDivElement | HTMLSpanElement | null) => assignRef(el, ref), [ref]);
		if (count > 1) {
			if (inline) {
				return (
					<>
						{repeat(count, i => (
							<span key={i} ref={i === 0 ? refCallback : undefined} className={resolvedClassName} {...props} />
						))}
					</>
				);
			}
			return (
				<>
					{repeat(count, i => (
						<div key={i} ref={i === 0 ? refCallback : undefined} className={resolvedClassName} {...props} />
					))}
				</>
			);
		}
		if (inline) {
			return <span ref={refCallback} className={resolvedClassName} {...props} />;
		}
		return <div ref={refCallback} className={resolvedClassName} {...props} />;
	}
);
Skeleton.displayName = 'Skeleton';
