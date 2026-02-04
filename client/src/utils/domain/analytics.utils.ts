import { TIME_DURATIONS_SECONDS } from '@shared/constants';
import type { UserAnalyticsRecord } from '@shared/types';

export function formatPlayTime(time: number, unit: 'seconds' | 'minutes' = 'seconds'): string {
	const totalSeconds = unit === 'seconds' ? time : time * TIME_DURATIONS_SECONDS.MINUTE;
	const hours = Math.floor(totalSeconds / TIME_DURATIONS_SECONDS.HOUR);
	const minutes = Math.floor((totalSeconds % TIME_DURATIONS_SECONDS.HOUR) / TIME_DURATIONS_SECONDS.MINUTE);

	if (hours > 0) {
		return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
	}
	return `${minutes}m`;
}

export function hasNoGames(gameStats: UserAnalyticsRecord | null | undefined): boolean {
	if (!gameStats) {
		return true;
	}

	return (
		gameStats.totalGames === 0 &&
		(gameStats.totalQuestionsAnswered === 0 || !gameStats.totalQuestionsAnswered) &&
		(!gameStats.recentActivity || gameStats.recentActivity.length === 0)
	);
}
