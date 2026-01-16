import { forwardRef, type SVGProps } from 'react';
import { cva } from 'class-variance-authority';
import { Loader2, RefreshCw, type LucideIcon } from 'lucide-react';

import { SpinnerSize } from '@/constants';
import type { FullScreenSpinnerProps, SpinnerProps, SVGSpinnerProps } from '@/types';
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

const iconMap: Record<'loader' | 'refresh', LucideIcon> = {
	loader: Loader2,
	refresh: RefreshCw,
};

function handleRefCallback<T extends SVGSVGElement | HTMLDivElement>(
	ref: React.Ref<SVGSVGElement | HTMLDivElement>,
	instance: T | null
): void {
	if (typeof ref === 'function') {
		ref(instance);
	} else if (ref && typeof ref === 'object' && ref !== null && 'current' in ref) {
		const refObject: { current: SVGSVGElement | HTMLDivElement | null } = ref;
		refObject.current = instance;
	}
}

function isFullScreenSpinnerProps(props: SpinnerProps): props is FullScreenSpinnerProps {
	return 'variant' in props && props.variant === 'fullscreen';
}

function isSVGSpinnerProps(props: SpinnerProps): props is SVGSpinnerProps {
	return (
		!('variant' in props) ||
		(props.variant !== 'fullscreen' && (props.variant === 'loader' || props.variant === 'refresh'))
	);
}

export const Spinner = forwardRef<SVGSVGElement | HTMLDivElement, SpinnerProps>((props, ref) => {
	const { size, className, variant = 'loader' } = props;

	if (isFullScreenSpinnerProps(props)) {
		const { variant: _variant, size: _size, className: _className, ...divProps } = props;
		const divRef: React.Ref<HTMLDivElement> = (instance: HTMLDivElement | null) => {
			handleRefCallback(ref, instance);
		};
		return (
			<div
				ref={divRef}
				className={cn(spinnerSizeVariants({ size: size ?? SpinnerSize.FULL }), 'spinner-pulsing', className)}
				{...divProps}
			/>
		);
	}

	if (isSVGSpinnerProps(props)) {
		const { variant: _variant, size: _size, className: _className, ...svgProps } = props;
		const Icon = variant === 'loader' || variant === 'refresh' ? iconMap[variant] : iconMap['loader'];
		const svgRef: React.Ref<SVGSVGElement> = (instance: SVGSVGElement | null) => {
			handleRefCallback(ref, instance);
		};
		return (
			<Icon
				ref={svgRef}
				className={cn(spinnerSizeVariants({ size: size ?? SpinnerSize.MD }), 'animate-spin', className)}
				{...svgProps}
			/>
		);
	}

	// Fallback - should never happen due to type system, but provides safety
	const Icon = iconMap['loader'];
	const svgProps: SVGProps<SVGSVGElement> = {};
	const fallbackSvgRef: React.Ref<SVGSVGElement> = (instance: SVGSVGElement | null) => {
		handleRefCallback(ref, instance);
	};
	return (
		<Icon
			ref={fallbackSvgRef}
			className={cn(spinnerSizeVariants({ size: size ?? SpinnerSize.MD }), 'animate-spin', className)}
			{...svgProps}
		/>
	);
});
Spinner.displayName = 'Spinner';
