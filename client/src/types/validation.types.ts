import type { SimpleValidationResult } from '@shared/types';

import type { ValidationHookOptions } from './ui/forms.types';

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
