/**
 * Base UI Component Types
 * @module BaseComponentTypes
 * @description Fundamental UI component prop types and interfaces used across the application
 */
import { MouseEvent, ReactNode } from 'react';

import { AvatarSize } from '../../../constants/ui';
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
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
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
export interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
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
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface CardTitleProps extends BaseComponentProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface CardGridProps extends BaseComponentProps {
  columns?: number;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  breakpoints?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

// Input Props
export interface UIInputProps extends BaseComponentProps {
  value: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  size?: 'sm' | 'md' | 'lg';
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
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  footer?: ReactNode;
  showBackdrop?: boolean;
  onBackdropClick?: () => void;
  isGlassy?: boolean;
  disableEscapeKeyDown?: boolean;
  disableBackdropClick?: boolean;
}

// Select Props
export interface UISelectProps extends BaseComponentProps {
  value: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  required?: boolean;
  name?: string;
  id?: string;
  isGlassy?: boolean;
  error?: boolean;
}

// Icon Props
export interface IconProps extends BaseComponentProps {
  name: string;
  size?: IconSize;
  color?: IconColor;
  animation?: IconAnimation;
  onClick?: (event: React.MouseEvent<SVGSVGElement>) => void;
  style?: React.CSSProperties;
}

export interface LucideIconProps extends BaseComponentProps {
  name: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  animation?: IconAnimation;
}

// Size and Color Types
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
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
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  center?: boolean;
  centered?: boolean;
}

export interface SectionProps extends BaseComponentProps {
  background?: 'default' | 'muted' | 'primary' | 'secondary' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface GridLayoutProps extends BaseComponentProps {
  columns?: number;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'content' | 'form' | 'stats' | 'layout' | 'cards' | 'game';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  responsive?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export interface ResponsiveGridProps extends BaseComponentProps {
  columns?: number;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  minWidth?: string;
  breakpoints?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

// Floating Card Props
export interface FloatingCardProps extends CardProps {
  floating?: boolean;
  floatingIntensity?: number;
  floatingDuration?: number;
  distance?: number;
  duration?: number;
  delay?: number;
}

// Avatar Props
export interface AvatarProps {
  src?: string;
  username?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  size?: AvatarSize;
  customSize?: number;
  className?: string;
  alt?: string;
  showLoading?: boolean;
  lazy?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}

// Size Variant
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
