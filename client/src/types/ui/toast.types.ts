import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';

import { ToastActionType, ToastVariant } from '@/constants';

export type ToastProps = ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & {
	variant?: ToastVariant;
};

export type ToastActionElement = ReactElement<typeof ToastPrimitive.Action>;

export type ToasterToast = ToastProps & {
	id: string;
	title?: string | ReactElement;
	description?: string | ReactElement;
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
