import type { CountRecord, TypeGuard } from '@shared/types';
import { VALIDATORS } from '@shared/validation';

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
	return Array.isArray(value) && value.every(item => VALIDATORS.string(item));
}

export function isNonEmptyString(value: unknown): value is string {
	return value != null && VALIDATORS.string(value) && !!value.trim();
}

export function normalizeStringArray(value?: unknown): string[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const normalized = value.filter((item): item is string => VALIDATORS.string(item) && !!item.trim());
	return normalized.length > 0 ? normalized : undefined;
}

export function groupByBy<T>(arr: T[], getKey: (item: T) => string): Record<string, T[]> {
	const grouped: Record<string, T[]> = {};
	for (const item of arr) {
		const key = getKey(item);
		grouped[key] ??= [];
		grouped[key].push(item);
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
		record[key] = value ?? 0;
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
