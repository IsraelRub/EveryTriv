import type { CountRecord, TypeGuard } from '@shared/types';

export function isRecord(value: unknown): value is Record<string, unknown> {
	return value != null && typeof value === 'object' && !Array.isArray(value);
}

export function hasProperty<K extends string>(value: unknown, property: K): value is Record<K, unknown> {
	return isRecord(value) && property in value;
}

export function hasPropertyOfType<K extends string, T>(
	value: unknown,
	property: K,
	typeGuard: TypeGuard<T>
): value is Record<K, T> & Record<string, unknown> {
	return hasProperty(value, property) && typeGuard(value[property]);
}

export function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every(item => typeof item === 'string');
}

export function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

export function isOneOf<T extends string>(allowedValues: readonly T[]): TypeGuard<T> {
	return (value: unknown): value is T => {
		if (typeof value !== 'string') {
			return false;
		}
		// TypeScript cannot infer that value is T from includes check alone
		// However, we know at runtime that if value is in allowedValues, it must be T
		// because allowedValues is readonly T[] and value is string
		// We use some() to avoid type assertion in includes
		return allowedValues.some(allowedValue => allowedValue === value);
	};
}

export function normalizeStringArray(value?: unknown): string[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const normalized = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
	return normalized.length > 0 ? normalized : undefined;
}

export function calculatePercentage(value: number, total: number): number {
	if (total === 0) return 0;

	const percentage = (value / total) * 100;
	return Math.round(percentage);
}

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
	const grouped: Record<string, T[]> = {};

	for (const item of arr) {
		const groupKey = String(item[key]);
		grouped[groupKey] ??= [];
		grouped[groupKey].push(item);
	}

	return grouped;
}

export function buildCountRecord<T>(
	items: T[],
	keySelector: (item: T) => string | null | undefined,
	countSelector: (item: T) => number | null | undefined
): CountRecord {
	const record: CountRecord = {};

	for (const item of items) {
		const key = keySelector(item);
		if (!key) {
			continue;
		}

		const value = countSelector(item);
		record[key] = Number(value ?? 0);
	}

	return record;
}

export function shuffle<T>(arr: T[]): T[] {
	const shuffled = [...arr];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const itemI = shuffled[i];
		const itemJ = shuffled[j];
		if (itemI != null && itemJ != null) {
			[shuffled[i], shuffled[j]] = [itemJ, itemI];
		}
	}
	return shuffled;
}
