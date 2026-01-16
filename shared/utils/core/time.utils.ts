export function calculateClockOffset(serverTimestamp: number): number {
	const clientTime = Date.now();
	return clientTime - serverTimestamp;
}

export function validateClockOffset(offset: number, thresholdSeconds: number = 5): boolean {
	const thresholdMs = thresholdSeconds * 1000;
	const absOffset = Math.abs(offset);
	return absOffset <= thresholdMs;
}
