/**
 * Validation UI Component Types
 * @module ValidationComponentTypes
 * @description UI component prop types for validation components
 */

import type { ValidationStatus } from '@shared/types';

import { ComponentSize } from '../../../constants';

/**
 * Validation component props
 */
export interface ValidationIconProps {
	status: ValidationStatus;
	size?: ComponentSize;
	animated?: boolean;
	className?: string;
	iconName?: string;
	tooltip?: string;
	showTooltip?: boolean;
}

export interface ValidationStatusIndicatorProps {
	status: ValidationStatus;
	previousStatus?: ValidationStatus;
	size?: ComponentSize;
	showTransitions?: boolean;
	className?: string;
}

export interface ValidationMessageProps {
	status: ValidationStatus;
	errors?: string[];
	warnings?: string[];
	successMessage?: string;
	showIcon?: boolean;
	showMessages?: boolean;
	className?: string;
	size?: ComponentSize;
	animationDuration?: number;
}
