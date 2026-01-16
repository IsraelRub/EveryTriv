import { TIME_PERIODS_MS } from '@shared/constants';

export const TOAST_LIMIT = 3;

export const TOAST_REMOVE_DELAY = 300;

export const DEFAULT_TOAST_DURATION = TIME_PERIODS_MS.FIVE_SECONDS;

export enum ToastActionType {
	ADD_TOAST = 'ADD_TOAST',
	UPDATE_TOAST = 'UPDATE_TOAST',
	DISMISS_TOAST = 'DISMISS_TOAST',
	REMOVE_TOAST = 'REMOVE_TOAST',
}
