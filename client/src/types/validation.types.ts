import type { BaseValidationResult, ValidationStatus } from '@shared/types';

import { ComponentSize } from '../constants';

/**
 * Validation hook options interface
 * @interface ValidationHookOptions
 * @description Options for client-side validation hooks
 */
export interface ValidationHookOptions {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	pattern?: RegExp;
	customValidator?: (value: string) => boolean;
	errorMessage?: string;
}

/**
 * Client alias for convenience
 * @type BasicValidationResult
 * @description Client-side alias for SimpleValidationResult from shared types
 */
export type BasicValidationResult = BaseValidationResult;

export type ClientValidationType = 'username' | 'password' | 'email' | 'topic' | 'customDifficulty' | 'language';

// Validator function type - accepts union type for flexibility
export type UnifiedValidator = (
	value: string,
	options?: ValidationHookOptions | { enableSpellCheck?: boolean; enableGrammarCheck?: boolean }
) => Promise<BasicValidationResult>;

export type ValidatorsMap = Record<ClientValidationType, UnifiedValidator>;

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
