import { TIME_DURATIONS_SECONDS } from '@shared/constants';
import { formatDate, formatDateShort, formatDateTime } from '@shared/utils';

export { formatDate, formatDateShort, formatDateTime };

export function formatTime(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / TIME_DURATIONS_SECONDS.MINUTE);
	const seconds = totalSeconds % TIME_DURATIONS_SECONDS.MINUTE;
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
