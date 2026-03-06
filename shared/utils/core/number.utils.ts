import { MAX_POINTS_PER_QUESTION, TIME_PERIODS_MS } from '@shared/constants';

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function sum(numbers: number[]): number {
	return numbers.reduce((a, b) => a + b, 0);
}

export function sumBy<T>(arr: T[], getValue: (item: T) => number): number {
	return arr.reduce((s, item) => s + getValue(item), 0);
}

export function mean(numbers: number[]): number {
	return numbers.length === 0 ? 0 : sum(numbers) / numbers.length;
}

export function meanBy<T>(arr: T[], getValue: (item: T) => number): number {
	return arr.length === 0 ? 0 : sumBy(arr, getValue) / arr.length;
}

export function getCurrentTimestampInSeconds(): number {
	return Math.floor(Date.now() / TIME_PERIODS_MS.SECOND);
}

export function calculateDuration(startTime: number): number {
	return Date.now() - startTime;
}

export function calculateElapsedSeconds(startTime: number): number {
	return Math.floor(calculateDuration(startTime) / TIME_PERIODS_MS.SECOND);
}

export function calculatePercentage(value: number, total: number, round: boolean = true): number {
	if (total === 0) return 0;
	const percentage = (value / total) * 100;
	return round ? Math.round(percentage) : percentage;
}

export function calculateScoreRate(score: number, totalQuestions: number): number {
	if (totalQuestions === 0) return 0;
	return Math.min(100, Math.round((100 * (score / totalQuestions)) / MAX_POINTS_PER_QUESTION));
}
