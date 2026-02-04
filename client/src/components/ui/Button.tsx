import { forwardRef, memo, useCallback, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { Home, RefreshCw, X } from 'lucide-react';

import { AudioKey, ButtonSize, ButtonVariant, ROUTES } from '@/constants';
import { useModalRoute } from '@/hooks';
import { audioService } from '@/services';
import type {
	ButtonProps,
	CloseButtonProps,
	HomeButtonProps,
	LinkButtonProps,
	RefreshButtonProps,
} from '@/types';
import { cn } from '@/utils';

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
	({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button';

		const handleClick = useCallback(
			(e: MouseEvent<HTMLButtonElement>) => {
				if (!asChild) {
					audioService.play(AudioKey.BUTTON_CLICK);
				}
				onClick?.(e);
			},
			[onClick, asChild]
		);

		return <Comp className={buttonVariants({ variant, size, className })} ref={ref} onClick={handleClick} {...props} />;
	}
);
Button.displayName = 'Button';

export const HomeButton = forwardRef<HTMLButtonElement, HomeButtonProps>(({ onClick }, ref) => {
	const navigate = useNavigate();

	const handleNavigateHome = useCallback(() => {
		navigate(ROUTES.HOME, { replace: true });
	}, [navigate]);

	return (
		<Button ref={ref} variant={ButtonVariant.OUTLINE} size={ButtonSize.LG} onClick={onClick || handleNavigateHome}>
			<Home className='h-4 w-4 mr-2' />
			Back to Home
		</Button>
	);
});
HomeButton.displayName = 'HomeButton';

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
	({ to, variant, size, className, children, ...linkProps }, ref) => {
		return (
			<Link ref={ref} to={to} className={buttonVariants({ variant, size, className })} {...linkProps}>
				{children}
			</Link>
		);
	}
);
LinkButton.displayName = 'LinkButton';

export const RefreshButton = memo(function RefreshButton({
	onClick,
	isLoading,
	size = ButtonSize.DEFAULT,
}: RefreshButtonProps) {
	return (
		<Button variant={ButtonVariant.OUTLINE} size={size} onClick={onClick} disabled={isLoading}>
			<RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin-slow')} />
			Refresh
		</Button>
	);
});

export function CloseButton({ to = ROUTES.HOME, className, onClose }: CloseButtonProps) {
	const { isModal, closeModal } = useModalRoute();

	const buttonProps = {
		className: cn(
			'p-2 rounded-full hover:bg-destructive transition-colors text-muted-foreground hover:text-white z-10 inline-flex items-center justify-center',
			className
		),
		children: <X className='h-5 w-5' />,
	};

	// If custom onClose is provided, use it
	if (onClose) {
		return <button type='button' onClick={onClose} {...buttonProps} />;
	}

	// If in modal mode, use closeModal
	if (isModal) {
		return <button type='button' onClick={closeModal} {...buttonProps} />;
	}

	// Otherwise, use Link for regular navigation
	return <Link to={to} {...buttonProps} />;
}
