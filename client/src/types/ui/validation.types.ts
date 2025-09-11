/**
 * Validation Types
 * @module ValidationTypes
 * @description Validation-related types and interfaces
 */
import { ValidationStatus } from '@shared/types/domain/validation/validation.types';

// Validation Message Props
export interface ValidationMessageProps {
	/** Validation message */
	message?: string;
	/** Validation status */
	status: ValidationStatus;
	/** Additional CSS classes */
	className?: string;
	/** Whether to show icon */
	showIcon?: boolean;
	/** Error messages */
	errors?: string[];
	/** Warning messages */
	warnings?: string[];
	/** Success message */
	successMessage?: string;
	/** Whether to show messages */
	showMessages?: boolean;
	/** Message size */
	size?: 'sm' | 'md' | 'lg';
	/** Animation duration */
	animationDuration?: number;
}

// Validation Icon Props
export interface ValidationIconProps {
	/** Validation status */
	status: ValidationStatus;
	/** Icon size */
	size?: 'sm' | 'md' | 'lg' | 'xs' | 'xl';
	/** Additional CSS classes */
	className?: string;
	/** Whether icon is animated */
	animated?: boolean;
	/** Icon name */
	iconName?: string;
	/** Tooltip text */
	tooltip?: string;
	/** Whether to show tooltip */
	showTooltip?: boolean;
}

// Validation Status Indicator Props
export interface ValidationStatusIndicatorProps {
	/** Validation status */
	status: ValidationStatus;
	/** Additional CSS classes */
	className?: string;
	/** Whether to show text */
	showText?: boolean;
	/** Custom status text */
	statusText?: string;
	/** Previous status */
	previousStatus?: ValidationStatus;
	/** Icon size */
	size?: 'sm' | 'md' | 'lg';
	/** Whether to show transitions */
	showTransitions?: boolean;
}
