/**
 * UI Component Types
 * @module UIComponentTypes
 * @description Type definitions for shadcn/ui components
 */
import { type ButtonHTMLAttributes, type HTMLAttributes } from 'react';

import { type VariantProps } from 'class-variance-authority';

import { badgeVariants } from '@/components/ui/badge';
import { ButtonSize } from '@/constants';

/**
 * Badge component props
 * @interface BadgeProps
 * @description Props for the Badge component from shadcn/ui
 */
export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

/**
 * Button component props
 * @interface ButtonProps
 * @description Props for the Button component from shadcn/ui
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
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
	'aria-label'?: string;
}
