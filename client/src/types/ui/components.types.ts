import { ReactNode, type ButtonHTMLAttributes, type ComponentPropsWithoutRef, type HTMLAttributes } from 'react';
import { type LinkProps } from 'react-router-dom';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';

import { ButtonSize, ButtonVariant, ComponentSize, LoadingMessages, TabsListVariant, VariantBase } from '@/constants';
import { badgeVariants } from '@/components';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
	variant?: VariantBase;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	asChild?: boolean;
}

export interface LinkButtonProps extends LinkProps {
	variant?: ButtonVariant;
	size?: ButtonSize;
	children: ReactNode;
}

export interface CloseButtonProps {
	to?: string;
	className?: string;
	onClose?: () => void;
}

export interface HomeButtonProps {
	onClick?: () => void;
	className?: string;
}

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
	size?: ComponentSize;
	message?: string;

	messageInline?: boolean;
}

export type FullPageSpinnerLayout = 'default' | 'appShell';

export interface FullPageSpinnerProps {
	message: LoadingMessages;
	layout?: FullPageSpinnerLayout;
	showSpinner?: boolean;
	showHomeButton?: boolean;
	onBeforeNavigate?: () => void;
}

export interface RefreshButtonProps {
	onClick: () => void;
	isLoading: boolean;
}

export interface EmptyStateProps {
	data: string;
	icon?: LucideIcon;
	title?: string;
	description?: string;
	/** When false: no button and UserX icon. When true or omitted: "Play Now" button and GamepadIcon. */
	showPlayNow?: boolean;
}

export interface PaginationButtonsProps {
	onPrevious: () => void;
	onNext: () => void;
	hasPrevious: boolean;
	hasNext: boolean;
	currentPage: number;
	totalPages: number;
	disabled?: boolean;
}

export interface TabsListProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
	variant?: TabsListVariant;
}
