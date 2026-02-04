import type { ReactNode } from 'react';

import { ToastActionType } from '@/constants';
import type { ToastActionElement, ToastProps } from '@/components';

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
			toastId?: string;
	  }
	| {
			type: ToastActionType.REMOVE_TOAST;
			toastId?: string;
	  };

export type AddToastOptions = Omit<ToasterToast, 'id'> & {
	duration?: number;
};

export type ToastHelperProps = Omit<AddToastOptions, 'variant'>;
