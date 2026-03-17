import { forwardRef, memo, useCallback, type ElementType, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { ArrowRight, Home, RefreshCw, X } from 'lucide-react';

import {
	AudioKey,
	ButtonSize,
	CommonKey,
	HomeKey,
	ROUTES,
	STATISTICS_TAB_PARAM,
	VariantBase,
	ViewAllDestination,
} from '@/constants';
import type {
	ButtonProps,
	CloseButtonProps,
	HomeButtonProps,
	LinkButtonProps,
	PaginationButtonsProps,
	RefreshButtonProps,
	ViewAllButtonProps,
} from '@/types';
import { audioService } from '@/services';
import { cn } from '@/utils';
import { useModalRoute } from '@/hooks';

const buttonVariantsConfig = {
	variants: {
		variant: {
			[VariantBase.DEFAULT]: 'bg-primary text-primary-foreground hover:bg-primary/90 active:opacity-90',
			[VariantBase.DESTRUCTIVE]: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
			[VariantBase.OUTLINE]:
				'border border-input bg-background hover:bg-primary hover:text-primary-foreground active:opacity-90',
			[VariantBase.SECONDARY]: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
			[VariantBase.MINIMAL]: 'hover:bg-accent hover:text-accent-foreground',
		},
		size: {
			[ButtonSize.SM]: 'h-9 rounded-md px-3',
			[ButtonSize.MD]: 'h-10 rounded-md px-4 py-2',
			[ButtonSize.LG]: 'h-11 rounded-md px-8',
			[ButtonSize.ICON_SM]: 'h-6 w-6 rounded-full p-0 aspect-square',
			[ButtonSize.ICON_MD]: 'h-9 w-9 rounded-full p-0',
			[ButtonSize.ICON_LG]: 'h-10 w-10 rounded-full p-0',
		},
	},
	defaultVariants: {
		variant: VariantBase.DEFAULT,
		size: ButtonSize.MD,
	},
} as const;

export const buttonVariants = cva(
	'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
	buttonVariantsConfig
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
		const Comp: ElementType = asChild ? Slot : 'button';

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

export const HomeButton = forwardRef<HTMLButtonElement, HomeButtonProps>(({ onBeforeNavigate, className }, ref) => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const handleClick = useCallback(() => {
		onBeforeNavigate?.();
		navigate(ROUTES.HOME, { replace: true });
	}, [navigate, onBeforeNavigate]);

	return (
		<Button ref={ref} variant={VariantBase.OUTLINE} size={ButtonSize.LG} onClick={handleClick} className={className}>
			<Home className='h-4 w-4 mr-2' />
			{t(CommonKey.BACK_TO_HOME)}
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

export const RefreshButton = memo(function RefreshButton({ onClick, isLoading }: RefreshButtonProps) {
	return (
		<Button variant={VariantBase.OUTLINE} size={ButtonSize.MD} onClick={onClick} disabled={isLoading}>
			<RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin-slow')} />
			Refresh
		</Button>
	);
});

export function CloseButton({ to = ROUTES.HOME, className, onClose }: CloseButtonProps) {
	const { isModal, closeModal } = useModalRoute();

	const buttonProps = {
		className: cn(
			buttonVariants({ variant: VariantBase.MINIMAL, size: ButtonSize.ICON_LG }),
			'rounded-full p-2 z-10 text-muted-foreground hover:bg-destructive/90 hover:text-destructive-foreground',
			className
		),
		children: <X className='h-5 w-5' />,
	};

	if (onClose) {
		return <button type='button' onClick={onClose} {...buttonProps} />;
	}
	if (isModal) {
		return <button type='button' onClick={closeModal} {...buttonProps} />;
	}
	return <Link to={to} {...buttonProps} />;
}

export const PaginationButtons = memo(function PaginationButtons({
	onPrevious,
	onNext,
	hasPrevious,
	hasNext,
	currentPage,
	totalPages,
	disabled = false,
}: PaginationButtonsProps) {
	const { t } = useTranslation();
	return (
		<div className='flex items-center gap-3'>
			<Button
				variant={VariantBase.OUTLINE}
				size={ButtonSize.SM}
				onClick={onPrevious}
				disabled={!hasPrevious || disabled}
			>
				{t(CommonKey.PREVIOUS)}
			</Button>
			{totalPages > 0 && (
				<span className='text-sm text-muted-foreground shrink-0'>
					{t(CommonKey.PAGE)} <span className='font-bold text-foreground'>{currentPage}</span> {t(CommonKey.OF)}{' '}
					<span className='font-bold text-foreground'>{totalPages}</span>
				</span>
			)}
			<Button variant={VariantBase.OUTLINE} size={ButtonSize.SM} onClick={onNext} disabled={!hasNext || disabled}>
				{t(CommonKey.NEXT)}
			</Button>
		</div>
	);
});

export function ViewAllButton({ destination, visible = true }: ViewAllButtonProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const path =
		ROUTES.STATISTICS +
		(destination === ViewAllDestination.STATISTICS ? '' : `?${STATISTICS_TAB_PARAM}=${destination}`);

	if (!visible) {
		return null;
	}

	return (
		<Button variant={VariantBase.MINIMAL} size={ButtonSize.SM} onClick={() => navigate(path)} className='text-xs'>
			{t(HomeKey.VIEW_ALL)} <ArrowRight className='h-3 w-3 ml-1 rtl:scale-x-[-1]' />
		</Button>
	);
}
