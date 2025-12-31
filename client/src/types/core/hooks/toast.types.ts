/**
 * Toast Hook Types
 * @module ToastHookTypes
 * @description Type definitions for toast hook and state management
 */
import type { ReactNode } from 'react';

import { ToastActionType } from '@/constants';
import type { ToastActionElement, ToastProps } from '@/types';

/**
 * Toaster toast type
 * @type ToasterToast
 * @description Extended toast type with id and action
 */
export type ToasterToast = ToastProps & {
	id: string;
	title?: ReactNode;
	description?: ReactNode;
	action?: ToastActionElement;
};

/**
 * Toast reducer action
 * @type Action
 * @description Union type for all toast reducer actions
 */
export type Action =
	| {
			type: ToastActionType.ADD_TOAST;
			toast: ToasterToast;
	  }
	| {
			type: ToastActionType.UPDATE_TOAST;
			toast: Partial<ToasterToast>;
	  }
	| {
			type: ToastActionType.DISMISS_TOAST;
			toastId?: ToasterToast['id'];
	  }
	| {
			type: ToastActionType.REMOVE_TOAST;
			toastId?: ToasterToast['id'];
	  };

/**
 * Toast state interface
 * @interface State
 * @description State for toast reducer
 */
export interface State {
	toasts: ToasterToast[];
}

/**
 * Toast function type
 * @type Toast
 * @description Type for toast function with duration
 */
export type Toast = Omit<ToasterToast, 'id'> & {
	duration?: number;
};
