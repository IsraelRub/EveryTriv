import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle } from 'lucide-react';

import { AlertVariant } from '@/constants';
import { cn } from '@/utils';

const ALERT_ICON_SIZE_CLASS = {
	sm: 'h-3 w-3',
	md: 'h-4 w-4',
	base: 'h-6 w-6',
	lg: 'h-5 w-5',
	xl: 'h-10 w-10',
	'2xl': 'h-16 w-16',
} as const;

const alertVariants = cva(
	'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
	{
		variants: {
			variant: {
				[AlertVariant.DEFAULT]: 'bg-background text-foreground',
				[AlertVariant.DESTRUCTIVE]: 'border-destructive/50 text-destructive [&>svg]:text-destructive',
			},
		},
		defaultVariants: { variant: AlertVariant.DEFAULT },
	}
);

export interface AlertProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
	showIcon?: boolean;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
	({ className, variant, showIcon = true, children, ...props }, ref) => (
		<div ref={ref} className={alertVariants({ variant, className })} {...props}>
			{variant === AlertVariant.DESTRUCTIVE && showIcon && <AlertTriangle className={ALERT_ICON_SIZE_CLASS.md} />}
			{children}
		</div>
	)
);
Alert.displayName = 'Alert';

export function AlertIcon({
	size = 'md',
	className,
}: {
	size?: keyof typeof ALERT_ICON_SIZE_CLASS;
	className?: string;
}) {
	return <AlertTriangle className={cn(ALERT_ICON_SIZE_CLASS[size], className)} />;
}

/** Lucide icon component for use in StatCard etc. when icon prop expects a component (e.g. icon={AlertIconSource}). */
export { AlertTriangle as AlertIconSource };

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
