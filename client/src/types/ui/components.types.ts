import { ReactNode, type ButtonHTMLAttributes, type ComponentPropsWithoutRef, type HTMLAttributes } from 'react';
import { type LinkProps } from 'react-router-dom';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';

import {
	AlertVariant,
	AvatarSize,
	AvatarVariant,
	ButtonSize,
	ComponentSize,
	TabsListVariant,
	VariantBase,
	type ViewAllDestination,
} from '@/constants';
import { badgeVariants } from '@/components';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
	variant?: AlertVariant;
	showIcon?: boolean;
}

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
	variant?: VariantBase;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: VariantBase;
	size?: ButtonSize;
	asChild?: boolean;
}

export interface LinkButtonProps extends LinkProps {
	variant?: VariantBase;
	size?: ButtonSize;
	children: ReactNode;
}

export interface CloseButtonProps {
	to?: string;
	className?: string;
	onClose?: () => void;
}

export interface HomeButtonProps {
	onBeforeNavigate?: () => void;
	className?: string;
}

export interface ViewAllButtonProps {
	destination: ViewAllDestination;
	visible?: boolean;
}

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
	size?: ComponentSize;
	message?: string;

	messageInline?: boolean;
}

export type FullPageSpinnerLayout = 'default' | 'appShell';

export interface FullPageSpinnerProps {
	message: string;
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

export interface SliderProps extends ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
	size?: 'default' | 'sm';
}

export interface TabsListProps extends ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
	variant?: TabsListVariant;
}

export interface SectionCardProps {
	title?: string;
	description?: string;
	icon?: LucideIcon;
	children: ReactNode;
	className?: string;
	contentClassName?: string;
}

export interface AvatarProps extends Omit<ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>, 'className'> {
	size?: AvatarSize;
	variant?: AvatarVariant;
	pointerEventsNone?: boolean;
}
