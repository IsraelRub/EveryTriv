export function formatPlayTime(time: number, unit: 'seconds' | 'minutes' = 'seconds'): string {
	const totalSeconds = unit === 'seconds' ? time : time * 60;
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);

	if (hours > 0) {
		return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	}
	return `${minutes}m`;
}
