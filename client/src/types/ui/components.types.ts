/**
 * UI Component Types
 * @module UIComponentTypes
 * @description Type definitions for shadcn/ui components
 */
import {
	type ButtonHTMLAttributes,
	type ComponentPropsWithoutRef,
	type HTMLAttributes,
	type ReactElement,
} from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { type VariantProps } from 'class-variance-authority';

import { ButtonSize, ButtonVariant, SpinnerSize, SpinnerVariant, VariantBase } from '@/constants';
import { badgeVariants, spinnerVariants, toastVariants } from '@/components';

/**
 * Badge component props
 * @interface BadgeProps
 * @description Props for the Badge component from shadcn/ui
 */
export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
	variant?: VariantBase;
}

/**
 * Button component props
 * @interface ButtonProps
 * @description Props for the Button component from shadcn/ui
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	asChild?: boolean;
}

/**
 * CloseButton component props
 * @interface CloseButtonProps
 * @description Props for the CloseButton component - a reusable close button that navigates to a specified route
 */
export interface CloseButtonProps {
	to?: string;
	className?: string;
}

/**
 * Toast component props
 * @type ToastProps
 * @description Props for the Toast component from shadcn/ui
 */
export type ToastProps = ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>;

/**
 * Toast action element type
 * @type ToastActionElement
 * @description Type for Toast action element
 */
export type ToastActionElement = ReactElement<typeof ToastPrimitive.Action>;

/**
 * Spinner component props
 * @interface SpinnerProps
 * @description Props for the Spinner component
 */
export interface SpinnerProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof spinnerVariants> {
	variant?: SpinnerVariant;
	size?: SpinnerSize;
}
