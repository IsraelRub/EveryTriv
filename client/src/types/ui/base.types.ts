/**
 * Base UI Component Types
 * @module BaseComponentTypes
 * @description Fundamental UI component prop types and interfaces used across the application
 */
import { ChangeEvent, ElementType, HTMLAttributes, MouseEvent, ReactNode } from 'react';

import type { SelectOption as SharedSelectOption } from '@shared/types';

import {
	AlertVariant,
	ButtonVariant,
	CardVariant,
	ComponentSize,
	ContainerSize,
	InteractiveSize,
	ModalSize,
	Spacing,
} from '../../constants';

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
	isGlassy?: boolean;
	withGlow?: boolean;
	withAnimation?: boolean;
	title?: string;
}

// Card Props
export interface CardProps extends BaseComponentProps, HTMLAttributes<HTMLDivElement> {
	variant?: CardVariant;
	padding?: Spacing;
	isGlassy?: boolean;
	withGlow?: boolean;
	onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

export interface CardContentProps extends BaseComponentProps {
	padding?: Spacing;
}

export interface CardGridProps extends BaseComponentProps {
	columns?: number;
	gap?: Spacing;
	element?: ElementType;
}

// Input Props
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
	min?: number;
	max?: number;
}

// Modal Props
export interface ModalProps extends BaseComponentProps {
	open: boolean;
	onClose: () => void;
	size?: ModalSize;
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

// Layout Props
export interface ContainerProps extends BaseComponentProps {
	maxWidth?: ContainerSize;
	size?: ContainerSize;
	padding?: Spacing;
	centered?: boolean;
}

export interface GridLayoutProps extends BaseComponentProps {
	columns?: number;
	gap?: Spacing;
	variant?: 'content' | 'cards' | 'stats' | 'form' | 'game' | 'balanced' | 'compact' | 'auto-fit';
	align?: 'start' | 'center' | 'end' | 'stretch';
	justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
	element?: ElementType;
}

export interface ResponsiveGridProps extends BaseComponentProps {
	columns?: number;
	gap?: Spacing;
	element?: ElementType;
}

// Avatar Props
export interface AvatarProps {
	src?: string;
	email?: string;
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

export type FeatureHighlightAccent = 'blue' | 'green' | 'purple' | 'orange';

export interface FeatureHighlightItem {
	id: string;
	icon: string;
	label: string;
	description?: string;
	accent?: FeatureHighlightAccent;
}
