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
	name: string;
	field: string;
	description?: string;
	errorMessage?: string;
	required: boolean;
	priority: number;
	validator: (value: string) => { isValid: boolean; errors: string[] };
}

/**
 * Validation schema type
 */
export interface ValidationSchema {
	name: string;
	version: string;
	fields: Record<string, ValidationRuleExtended[]>;
	crossFieldValidations?: ValidationRuleExtended[];
}

