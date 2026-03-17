import { forwardRef, HTMLAttributes } from 'react';
import { cva } from 'class-variance-authority';
import { AlertTriangle } from 'lucide-react';

import { AlertIconSize, AlertVariant } from '@/constants';
import type { AlertProps } from '@/types';
import { cn } from '@/utils';

const ALERT_ICON_SIZE_CLASSES: Record<AlertIconSize, string> = {
	[AlertIconSize.SM]: 'h-3 w-3',
	[AlertIconSize.MD]: 'h-4 w-4',
	[AlertIconSize.BASE]: 'h-6 w-6',
	[AlertIconSize.LG]: 'h-5 w-5',
	[AlertIconSize.XL]: 'h-10 w-10',
	[AlertIconSize.XXL]: 'h-16 w-16',
};

function getAlertSvgSizeClass(size: AlertIconSize): string {
	const base = ALERT_ICON_SIZE_CLASSES[size];
	return base
		? base
				.split(' ')
				.map(c => `[&_svg]:${c}`)
				.join(' ')
		: '';
}

const alertVariants = cva(
	'flex w-full items-center gap-3 rounded-lg border p-4 [&>svg]:shrink-0 [&>svg]:text-foreground',
	{
		variants: {
			variant: {
				[AlertVariant.DEFAULT]: 'bg-background text-foreground',
				[AlertVariant.DESTRUCTIVE]: 'border-destructive/50 bg-destructive/5 text-destructive [&>svg]:text-destructive',
			},
		},
		defaultVariants: { variant: AlertVariant.DEFAULT },
	}
);

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
	({ className, variant, showIcon = true, children, ...props }, ref) => (
		<div
			ref={ref}
			className={cn(alertVariants({ variant }), getAlertSvgSizeClass(AlertIconSize.MD), className)}
			{...props}
		>
			{variant === AlertVariant.DESTRUCTIVE && showIcon && (
				<span className='flex shrink-0 text-destructive'>
					<AlertTriangle className='stroke-current' strokeWidth={2} />
				</span>
			)}
			{children}
		</div>
	)
);
Alert.displayName = 'Alert';

export function AlertIcon({ size = AlertIconSize.MD, className }: { size?: AlertIconSize; className?: string }) {
	return <AlertTriangle className={cn(ALERT_ICON_SIZE_CLASSES[size], className)} />;
}

export const AlertTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
	({ className, ...props }, ref) => (
		<h5 ref={ref} className={cn('mb-1 font-medium leading-none tracking-tight', className)} {...props} />
	)
);
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
	)
);
AlertDescription.displayName = 'AlertDescription';
