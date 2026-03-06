import { TIME_DURATIONS_SECONDS, TIME_PERIODS_MS } from '@shared/constants';

export function calculateClockOffset(serverTimestamp: number): number {
	const clientTime = Date.now();
	return clientTime - serverTimestamp;
}

export function validateClockOffset(
	offset: number,
	thresholdSeconds: number = TIME_DURATIONS_SECONDS.FIVE_SECONDS
): boolean {
	const thresholdMs = thresholdSeconds * TIME_PERIODS_MS.SECOND;
	const absOffset = Math.abs(offset);
	return absOffset <= thresholdMs;
}

export function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}
