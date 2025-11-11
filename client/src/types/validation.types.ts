import type { SimpleValidationResult } from '@shared/types';

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
export type BasicValidationResult = SimpleValidationResult;

export type ClientValidationType = 'username' | 'password' | 'email' | 'topic' | 'customDifficulty' | 'language';

// Validator function type - accepts union type for flexibility
export type UnifiedValidator = (
	value: string,
	options?: ValidationHookOptions | { enableSpellCheck?: boolean; enableGrammarCheck?: boolean }
) => Promise<BasicValidationResult>;

export type ValidatorsMap = Record<ClientValidationType, UnifiedValidator>;
