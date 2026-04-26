import { EMPTY_VALUE, TIME_DURATIONS_SECONDS } from '@shared/constants';
import { pad2 } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { PlayTimeUnit } from '@/constants';

export function formatDateShort(date: Date | string | null | undefined, defaultValue: string = EMPTY_VALUE): string {
	if (!date || !VALIDATORS.date(date)) {
		return defaultValue;
	}
	const d = VALIDATORS.string(date) ? new Date(date) : date;
	return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

export function formatTime(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / TIME_DURATIONS_SECONDS.MINUTE);
	const seconds = totalSeconds % TIME_DURATIONS_SECONDS.MINUTE;
	return `${pad2(minutes)}:${pad2(seconds)}`;
}

export function formatPlayTime(time: number, unit: PlayTimeUnit = PlayTimeUnit.SECONDS): string {
	const totalSeconds = unit === PlayTimeUnit.SECONDS ? time : time * TIME_DURATIONS_SECONDS.MINUTE;
	const hours = Math.floor(totalSeconds / TIME_DURATIONS_SECONDS.HOUR);
	const minutes = Math.floor((totalSeconds % TIME_DURATIONS_SECONDS.HOUR) / TIME_DURATIONS_SECONDS.MINUTE);

	if (hours > 0) {
		return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
	}
	return `${minutes}m`;
}

export function formatTimeLimitDisplay(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / TIME_DURATIONS_SECONDS.MINUTE);
	const seconds = totalSeconds % TIME_DURATIONS_SECONDS.MINUTE;
	if (minutes === 0) return `${totalSeconds}s`;
	const remainder = seconds > 0 ? ` ${seconds}s` : '';
	return `${minutes}m${remainder}`;
}
