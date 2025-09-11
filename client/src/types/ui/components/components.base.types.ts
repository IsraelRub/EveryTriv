/**
 * Base UI Component Types
 * @module BaseComponentTypes
 * @description Fundamental UI component prop types and interfaces used across the application
 */
import { MouseEvent, ReactNode } from 'react';
import { IconAnimation } from '../animations.types';
import { AvatarSize } from '../../../constants/ui';

// Base Component Props
export interface BaseComponentProps {
	/** Additional CSS classes */
	className?: string;
	/** Component ID */
	id?: string;
	/** Whether component is disabled */
	disabled?: boolean;
	/** Component children */
	children?: ReactNode;
}

// Button Props
export interface ButtonProps extends BaseComponentProps {
	/** Button text */
	children: ReactNode;
	/** Button variant */
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
	/** Button size */
	size?: 'sm' | 'md' | 'lg';
	/** Button type */
	type?: 'button' | 'submit' | 'reset';
	/** Whether button is loading */
	loading?: boolean;
	/** Button click handler */
	onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
	/** Whether button is full width */
	fullWidth?: boolean;
	/** Button icon */
	icon?: ReactNode;
	/** Icon position */
	iconPosition?: 'left' | 'right';
	/** Whether button has glass effect */
	isGlassy?: boolean;
	/** Whether button has glow effect */
	withGlow?: boolean;
	/** Whether button has animation */
	withAnimation?: boolean;
	/** Button title */
	title?: string;
}

// Card Props
export interface CardProps extends BaseComponentProps {
	/** Card variant */
	variant?: 'default' | 'elevated' | 'outlined' | 'glass';
	/** Card padding */
	padding?: 'none' | 'sm' | 'md' | 'lg';
	/** Card shadow */
	shadow?: 'none' | 'sm' | 'md' | 'lg';
	/** Whether card has glass effect */
	isGlassy?: boolean;
	/** Whether card has glow effect */
	withGlow?: boolean;
	/** Whether card is clickable */
	clickable?: boolean;
	/** Card click handler */
	onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

export interface CardHeaderProps extends BaseComponentProps {
	/** Header title */
	title?: string;
	/** Header subtitle */
	subtitle?: string;
	/** Header actions */
	actions?: ReactNode;
}

export interface CardContentProps extends BaseComponentProps {
	/** Content padding */
	padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface CardTitleProps extends BaseComponentProps {
	/** Title level */
	level?: 1 | 2 | 3 | 4 | 5 | 6;
	/** Title size */
	size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface CardGridProps extends BaseComponentProps {
	/** Grid columns */
	columns?: number;
	/** Grid gap */
	gap?: 'sm' | 'md' | 'lg' | 'xl';
	/** Grid responsive breakpoints */
	breakpoints?: {
		sm?: number;
		md?: number;
		lg?: number;
		xl?: number;
	};
}

// Input Props
export interface UIInputProps extends BaseComponentProps {
	/** Input value */
	value: string;
	/** Input change handler */
	onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
	/** Input placeholder */
	placeholder?: string;
	/** Input type */
	type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
	/** Input size */
	size?: 'sm' | 'md' | 'lg';
	/** Whether input is required */
	required?: boolean;
	/** Input name */
	name?: string;
	/** Input ID */
	id?: string;
	/** Whether input has glass effect */
	isGlassy?: boolean;
	/** Input error state */
	error?: boolean;
	/** Whether input has animation */
	withAnimation?: boolean;
}

// Modal Props
export interface ModalProps extends BaseComponentProps {
	/** Whether modal is open */
	open: boolean;
	/** Whether modal is open (alias) */
	isOpen?: boolean;
	/** Modal close handler */
	onClose: () => void;
	/** Modal title */
	title?: string;
	/** Modal size */
	size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
	/** Whether modal is closable */
	closable?: boolean;
	/** Modal footer */
	footer?: ReactNode;
	/** Whether to show backdrop */
	showBackdrop?: boolean;
	/** Backdrop click handler */
	onBackdropClick?: () => void;
	/** Whether modal has glass effect */
	isGlassy?: boolean;
	/** Whether to disable escape key */
	disableEscapeKeyDown?: boolean;
	/** Whether to disable backdrop click */
	disableBackdropClick?: boolean;
}

// Select Props
export interface UISelectProps extends BaseComponentProps {
	/** Select value */
	value: string;
	/** Select change handler */
	onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
	/** Select options */
	options: Array<{ value: string; label: string }>;
	/** Select placeholder */
	placeholder?: string;
	/** Select size */
	size?: 'sm' | 'md' | 'lg';
	/** Whether select is required */
	required?: boolean;
	/** Select name */
	name?: string;
	/** Select ID */
	id?: string;
	/** Whether select has glass effect */
	isGlassy?: boolean;
	/** Select error state */
	error?: boolean;
}

// Icon Props
export interface IconProps extends BaseComponentProps {
	/** Icon name */
	name: string;
	/** Icon size */
	size?: IconSize;
	/** Icon color */
	color?: IconColor;
	/** Icon animation */
	animation?: IconAnimation;
	/** Icon click handler */
	onClick?: (event: React.MouseEvent<SVGSVGElement>) => void;
	/** Icon style */
	style?: React.CSSProperties;
}

export interface LucideIconProps extends BaseComponentProps {
	/** Icon name */
	name: string;
	/** Icon size */
	size?: number | string;
	/** Icon color */
	color?: string;
	/** Icon stroke width */
	strokeWidth?: number;
	/** Icon animation */
	animation?: IconAnimation;
}

// Size and Color Types
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type IconColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'muted' | 'white' | 'black' | 'accent';

// Layout Props
export interface ContainerProps extends BaseComponentProps {
	/** Container max width */
	maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
	/** Container size (alias for maxWidth) */
	size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
	/** Container padding */
	padding?: 'none' | 'sm' | 'md' | 'lg';
	/** Container center content */
	center?: boolean;
	/** Container centered (alias for center) */
	centered?: boolean;
}

export interface SectionProps extends BaseComponentProps {
	/** Section background */
	background?: 'default' | 'muted' | 'primary' | 'secondary' | 'glass';
	/** Section padding */
	padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
	/** Section margin */
	margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface GridLayoutProps extends BaseComponentProps {
	/** Grid columns */
	columns?: number;
	/** Grid gap */
	gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
	/** Grid variant */
	variant?: 'default' | 'content' | 'form' | 'stats' | 'layout' | 'cards' | 'game';
	/** Grid alignment */
	align?: 'start' | 'center' | 'end' | 'stretch';
	/** Grid justify */
	justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
	/** Grid responsive columns */
	responsive?: {
		sm?: number;
		md?: number;
		lg?: number;
		xl?: number;
	};
}

export interface ResponsiveGridProps extends BaseComponentProps {
	/** Grid columns */
	columns?: number;
	/** Grid gap */
	gap?: 'sm' | 'md' | 'lg' | 'xl';
	/** Minimum width for grid items */
	minWidth?: string;
	/** Grid breakpoints */
	breakpoints?: {
		sm?: number;
		md?: number;
		lg?: number;
		xl?: number;
	};
}

// Floating Card Props
export interface FloatingCardProps extends CardProps {
	/** Floating animation */
	floating?: boolean;
	/** Floating intensity */
	floatingIntensity?: number;
	/** Floating duration */
	floatingDuration?: number;
	/** Floating distance */
	distance?: number;
	/** Animation duration */
	duration?: number;
	/** Animation delay */
	delay?: number;
}

// Avatar Props
export interface AvatarProps {
	/** Avatar image URL */
	src?: string;
	/** Username for initials fallback */
	username?: string;
	/** Full name for initials fallback */
	fullName?: string;
	/** First name for initials fallback */
	firstName?: string;
	/** Last name for initials fallback */
	lastName?: string;
	/** Size of the avatar */
	size?: AvatarSize;
	/** Custom size in pixels */
	customSize?: number;
	/** Additional CSS classes */
	className?: string;
	/** Alt text for accessibility */
	alt?: string;
	/** Whether to show loading state */
	showLoading?: boolean;
	/** Whether to enable lazy loading */
	lazy?: boolean;
	/** Click handler */
	onClick?: () => void;
	/** Whether avatar is clickable */
	clickable?: boolean;
}

// Size Variant
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
