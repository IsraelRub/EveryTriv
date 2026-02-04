export const FILTER_ALL_VALUE = '__all__';

export enum SortField {
	DATE = 'date',
	SCORE = 'score',
	TOPIC = 'topic',
	DIFFICULTY = 'difficulty',
}

export enum SortDirection {
	ASC = 'asc',
	DESC = 'desc',
}

export const SORT_FIELD_VALUES = new Set<string>(Object.values(SortField));

export enum AchievementCardVariant {
	DEFAULT = 'default',
	COMPACT = 'compact',
	DETAILED = 'detailed',
}
