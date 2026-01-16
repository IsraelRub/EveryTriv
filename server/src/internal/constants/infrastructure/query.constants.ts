export enum WildcardPattern {
	BOTH = 'both',
	START = 'start',
	END = 'end',
	NONE = 'none',
}

export const SQL_CONDITIONS = {
	IS_NOT_NULL: 'IS NOT NULL',
	IS_NULL: 'IS NULL',
} as const;
