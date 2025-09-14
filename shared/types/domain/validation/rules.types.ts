/**
 * Validation rules and schemas types for EveryTriv
 *
 * @module ValidationRulesTypes
 * @description Validation rule definitions and schema types
 */


/**
 * Validation rule definition (extended)
 */
export interface ValidationRuleExtended {
	/** Rule name */
	name: string;
	/** Field name to validate */
	field: string;
	/** Rule description */
	description?: string;
	/** Error message template */
	errorMessage?: string;
	/** Whether rule is required */
	required: boolean;
	/** Rule priority (lower = higher priority) */
	priority: number;
	/** Validation function */
	validator: (value: string) => { isValid: boolean; errors: string[] };
}

/**
 * Validation schema type
 */
export interface ValidationSchema {
	/** Schema name */
	name: string;
	/** Schema version */
	version: string;
	/** Field validations */
	fields: Record<string, ValidationRuleExtended[]>;
	/** Cross-field validations */
	crossFieldValidations?: ValidationRuleExtended[];
}

