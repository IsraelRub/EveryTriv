import { cloneElement, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cva } from 'class-variance-authority';
import { Circle, Loader2 } from 'lucide-react';

import { ComponentSize, ROUTES } from '@/constants';
import type { FullPageSpinnerProps, SpinnerProps } from '@/types';
import { cn } from '@/utils';
import { HomeButton } from './button';

export const spinnerSizeVariants = cva('', {
	variants: {
		size: {
			[ComponentSize.SM]: 'h-4 w-4',
			[ComponentSize.MD]: 'h-5 w-5',
			[ComponentSize.LG]: 'h-6 w-6',
			[ComponentSize.XL]: 'h-12 w-12',
			[ComponentSize.FULL]: 'h-16 w-16',
		},
	},
	defaultVariants: { size: ComponentSize.MD },
});

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>((props, ref) => {
	const { message, messageInline, size, className, ...rest } = props;
	const sizeClass = spinnerSizeVariants({ size: size ?? ComponentSize.MD });
	const spinnerSpan = (
		<span className={cn('relative inline-block', sizeClass, className)} {...rest}>
			<Circle className='absolute inset-0 size-full opacity-25 text-primary' fill='none' strokeWidth={2} />
			<Loader2 className='animate-spin size-full text-primary' strokeWidth={2} />
		</span>
	);
	if (message !== undefined) {
		const wrapperClass = messageInline
			? 'inline-flex flex-row items-center justify-center gap-2 self-center'
			: 'flex flex-col items-center gap-4';
		return (
			<span ref={ref} className={wrapperClass}>
				{spinnerSpan}
				<span className='text-muted-foreground text-sm m-0'>{message}</span>
			</span>
		);
	}
	return cloneElement(spinnerSpan, { ref });
});
Spinner.displayName = 'Spinner';

const VIEW_MAIN_CLASS = 'view-main flex flex-col items-center justify-center animate-fade-in-only';
const APP_SHELL_MAIN_CLASS = 'app-main flex items-center justify-center min-h-screen';
const APP_SHELL_MAIN_ID = 'main-content';

export function FullPageSpinner({
	message,
	layout = 'default',
	showSpinner = true,
	showHomeButton = true,
	onBeforeNavigate,
}: FullPageSpinnerProps) {
	const navigate = useNavigate();
	const handleHomeClick = () => {
		onBeforeNavigate?.();
		navigate(ROUTES.HOME);
	};
	const isAppShell = layout === 'appShell';
	const mainClassName = isAppShell ? APP_SHELL_MAIN_CLASS : VIEW_MAIN_CLASS;
	const mainId = isAppShell ? APP_SHELL_MAIN_ID : undefined;

	return (
		<main id={mainId} className={mainClassName}>
			<div className='text-center flex flex-col items-center gap-6'>
				{showSpinner && <Spinner size={ComponentSize.FULL} className='mx-auto' />}
				<div className='text-lg md:text-xl font-bold text-foreground'>{message}</div>
				{showHomeButton && <HomeButton onClick={handleHomeClick} />}
			</div>
		</main>
	);
}
