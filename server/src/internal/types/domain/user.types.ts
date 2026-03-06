export interface UserFieldConfig {
	type: 'string' | 'number' | 'boolean';
	fieldName?: string;
	minLength?: number;
	maxLength?: number;
}
