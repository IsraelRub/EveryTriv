import { VALIDATORS } from '@shared/constants';

export function formatTime(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatDate(date: Date | string | null | undefined, defaultValue: string = '-'): string {
	if (!date || !VALIDATORS.date(date)) {
		return defaultValue;
	}

	const dateObj = typeof date === 'string' ? new Date(date) : date;

	const day = dateObj.getDate().toString().padStart(2, '0');
	const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
	const year = dateObj.getFullYear();

	return `${day}/${month}/${year}`;
}
