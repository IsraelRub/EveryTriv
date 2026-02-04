import { ReactNode, type ButtonHTMLAttributes, type HTMLAttributes, type SVGProps } from 'react';
import { type LinkProps } from 'react-router-dom';
import { type VariantProps } from 'class-variance-authority';

import { ButtonSize, ButtonVariant, SpinnerSize, VariantBase } from '@/constants';
import { badgeVariants } from '@/components';

export type { ToastActionElement, ToastProps } from '@/components';

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
}

export interface SpinnerProps extends SVGProps<SVGSVGElement> {
	size?: SpinnerSize;
}

export interface RefreshButtonProps {
	onClick: () => void;
	isLoading: boolean;
	size?: ButtonSize;
}
