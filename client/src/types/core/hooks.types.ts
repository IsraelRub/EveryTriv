import type { ReactNode } from 'react';

import { ToastActionType } from '@/constants';
import type { ToastActionElement, ToastProps } from '@/types';

export type ToasterToast = ToastProps & {
	id: string;
	title?: ReactNode;
	description?: ReactNode;
	action?: ToastActionElement;
};

export type ToastAction =
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

export type Toast = Omit<ToasterToast, 'id'> & {
	duration?: number;
};
