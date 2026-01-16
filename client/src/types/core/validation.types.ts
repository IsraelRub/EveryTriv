export interface ValidationHookOptions {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	pattern?: RegExp;
	customValidator?: (value: string) => boolean;
	errorMessage?: string;
}
