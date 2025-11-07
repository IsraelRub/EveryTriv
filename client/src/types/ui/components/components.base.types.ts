/**
 * Base UI Component Types
 * @module BaseComponentTypes
 * @description Fundamental UI component prop types and interfaces used across the application
 */
import { ChangeEvent, CSSProperties, ElementType, HTMLAttributes, MouseEvent, ReactNode } from 'react';

import type { SelectOption as SharedSelectOption } from '@shared/types';

import {
	AlertVariant,
	ButtonVariant,
	CardVariant,
	ComponentSize,
	ContainerSize,
	InteractiveSize,
	ModalSize,
	ShadowSize,
	Spacing,
} from '../../../constants';
import { IconAnimation } from '../animations.types';

// Base Component Props
export interface BaseComponentProps {
	className?: string;
	id?: string;
	disabled?: boolean;
	children?: ReactNode;
}

// Button Props
export interface ButtonProps extends BaseComponentProps {
	children: ReactNode;
	variant?: ButtonVariant;
	size?: InteractiveSize;
	type?: 'button' | 'submit' | 'reset';
	loading?: boolean;
	onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
	fullWidth?: boolean;
	icon?: ReactNode;
	iconPosition?: 'left' | 'right';
	isGlassy?: boolean;
	withGlow?: boolean;
	withAnimation?: boolean;
	title?: string;
}

// Card Props
export interface CardProps extends BaseComponentProps, HTMLAttributes<HTMLDivElement> {
	variant?: CardVariant;
	padding?: Spacing;
	shadow?: ShadowSize;
	isGlassy?: boolean;
	withGlow?: boolean;
	clickable?: boolean;
	onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

export interface CardHeaderProps extends BaseComponentProps {
	title?: string;
	subtitle?: string;
	actions?: ReactNode;
}

export interface CardContentProps extends BaseComponentProps {
	padding?: Spacing;
}

export interface CardTitleProps extends BaseComponentProps {
	level?: 1 | 2 | 3 | 4 | 5 | 6;
	size?: ComponentSize;
}

export interface CardGridProps extends BaseComponentProps {
	columns?: number;
	gap?: Spacing;
	as?: ElementType;
	breakpoints?: Breakpoints;
}

// Input Props (deprecated - use ValidatedInput instead)
export interface UIInputProps extends BaseComponentProps {
	value: string;
	onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
	size?: InteractiveSize;
	required?: boolean;
	name?: string;
	id?: string;
	isGlassy?: boolean;
	error?: boolean;
	withAnimation?: boolean;
}

// Modal Props
export interface ModalProps extends BaseComponentProps {
	open: boolean;
	isOpen?: boolean;
	onClose: () => void;
	title?: string;
	size?: ModalSize;
	closable?: boolean;
	footer?: ReactNode;
	showBackdrop?: boolean;
	onBackdropClick?: () => void;
	isGlassy?: boolean;
	disableEscapeKeyDown?: boolean;
	disableBackdropClick?: boolean;
}

export interface AlertModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	message: string;
	variant?: AlertVariant;
	buttonText?: string;
}

export interface ConfirmModalProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	variant?: AlertVariant;
	isLoading?: boolean;
}

// Select Props
export interface UISelectProps extends BaseComponentProps {
	value: string;
	onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
	options: SharedSelectOption[];
	placeholder?: string;
	size?: InteractiveSize;
	required?: boolean;
	name?: string;
	id?: string;
	isGlassy?: boolean;
	error?: boolean;
}

// Icon Props
export interface IconProps extends BaseComponentProps {
	name: string;
	size?: ComponentSize;
	color?: IconColor;
	animation?: IconAnimation;
	onClick?: (event: MouseEvent<SVGSVGElement>) => void;
	style?: CSSProperties;
}

// Size and Color Types
export type IconColor =
	| 'primary'
	| 'secondary'
	| 'success'
	| 'warning'
	| 'error'
	| 'info'
	| 'muted'
	| 'white'
	| 'black'
	| 'accent';

// Layout Props
export interface ContainerProps extends BaseComponentProps {
	maxWidth?: ContainerSize;
	size?: ContainerSize;
	padding?: Spacing;
	center?: boolean;
	centered?: boolean;
}

// Breakpoints Type
export type Breakpoints = {
	sm?: number;
	md?: number;
	lg?: number;
	xl?: number;
};

export interface GridLayoutProps extends BaseComponentProps {
	columns?: number;
	gap?: Spacing;
	variant?: 'content' | 'cards' | 'stats' | 'form' | 'game' | 'balanced' | 'compact' | 'auto-fit';
	align?: 'start' | 'center' | 'end' | 'stretch';
	justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
	as?: ElementType;
	responsive?: Breakpoints;
	minWidth?: string;
}

export interface ResponsiveGridProps extends BaseComponentProps {
	columns?: number;
	gap?: Spacing;
	minWidth?: string;
	maxColumns?: number;
	as?: ElementType;
	breakpoints?: Breakpoints;
}

// Avatar Props
export interface AvatarProps {
	src?: string;
	username?: string;
	fullName?: string;
	firstName?: string;
	lastName?: string;
	size?: ComponentSize;
	customSize?: number;
	className?: string;
	alt?: string;
	showLoading?: boolean;
	lazy?: boolean;
	onClick?: () => void;
	clickable?: boolean;
}
