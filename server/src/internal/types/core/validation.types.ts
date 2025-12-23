/**
 * Server Validation Types (server-only)
 * @module ServerValidationTypes
 * @description Server-side validation type definitions
 */

import type { BaseValidationResult } from '@shared/types';

/**
 * Password validation result interface
 * @interface PasswordValidationResult
 * @description Extended validation result for password validation with additional checks
 */
export interface PasswordValidationResult extends BaseValidationResult {
	checks: {
		hasMinLength: boolean;
	};
}
