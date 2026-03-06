export const VALIDATORS = {
	string: (value: unknown): value is string => typeof value === 'string',
	number: (value: unknown): value is number =>
		typeof value === 'number' && !Number.isNaN(value) && Number.isFinite(value),
	boolean: (value: unknown): value is boolean => typeof value === 'boolean',
	function: (value: unknown): value is Function => typeof value === 'function',
	date: (value: unknown): value is Date | string =>
		(value instanceof Date && !Number.isNaN(value.getTime())) ||
		(typeof value === 'string' && !Number.isNaN(Date.parse(value))),
} as const;
