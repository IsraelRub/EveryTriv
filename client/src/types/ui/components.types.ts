import {
	ReactNode,
	type ButtonHTMLAttributes,
	type ComponentPropsWithoutRef,
	type HTMLAttributes,
	type ReactElement,
	type SVGProps,
} from 'react';
import { type LinkProps } from 'react-router-dom';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { type VariantProps } from 'class-variance-authority';

import { ButtonSize, ButtonVariant, SpinnerSize, VariantBase } from '@/constants';
import { badgeVariants, toastVariants } from '@/components';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
	variant?: VariantBase;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	asChild?: boolean;
}

export interface CloseButtonProps {
	to?: string;
	className?: string;
	onClose?: () => void;
}

export interface BackToHomeButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
	text?: string;
}

export interface LinkButtonProps extends Omit<LinkProps, 'className'> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	className?: string;
	children: ReactNode;
}

export type ToastProps = ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>;

export type ToastActionElement = ReactElement<typeof ToastPrimitive.Action>;

interface BaseSpinnerProps {
	size?: SpinnerSize;
}

export interface SVGSpinnerProps extends SVGProps<SVGSVGElement>, BaseSpinnerProps {
	variant?: 'loader' | 'refresh';
}

export interface FullScreenSpinnerProps extends HTMLAttributes<HTMLDivElement>, BaseSpinnerProps {
	variant: 'fullscreen';
}

export type SpinnerProps = SVGSpinnerProps | FullScreenSpinnerProps;
