import { useEffect, useState } from 'react';

import {
	AudioKey,
	DEFAULT_TOAST_DURATION,
	TOAST_LIMIT,
	TOAST_REMOVE_DELAY,
	ToastActionType,
	ToastVariant,
} from '@/constants';
import type { AddToastOptions, ToastAction, ToasterToast, ToastHelperProps } from '@/types';
import { audioService } from '@/services';

let count = 0;

function genId() {
	count = (count + 1) % Number.MAX_SAFE_INTEGER;
	return count.toString();
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
	if (toastTimeouts.has(toastId)) {
		return;
	}

	const timeout = setTimeout(() => {
		toastTimeouts.delete(toastId);
		dispatch({
			type: ToastActionType.REMOVE_TOAST,
			toastId: toastId,
		});
	}, TOAST_REMOVE_DELAY);

	toastTimeouts.set(toastId, timeout);
};

const reducer = (state: ToasterToast[], action: ToastAction): ToasterToast[] => {
	switch (action.type) {
		case ToastActionType.ADD_TOAST:
			return [action.toast, ...state].slice(0, TOAST_LIMIT);

		case ToastActionType.UPDATE_TOAST:
			return state.map(t => (t.id === action.toast.id ? { ...t, ...action.toast } : t));

		case ToastActionType.DISMISS_TOAST: {
			const { toastId } = action;

			if (toastId) {
				addToRemoveQueue(toastId);
			} else {
				state.forEach(toast => {
					addToRemoveQueue(toast.id);
				});
			}

			return state.map(t =>
				t.id === toastId || toastId === undefined
					? {
							...t,
							open: false,
						}
					: t
			);
		}
		case ToastActionType.REMOVE_TOAST:
			if (action.toastId === undefined) {
				return [];
			}
			return state.filter(t => t.id !== action.toastId);
		default:
			return state;
	}
};

const listeners: ((state: ToasterToast[]) => void)[] = [];

let memoryState: ToasterToast[] = [];

function dispatch(action: ToastAction) {
	memoryState = reducer(memoryState, action);
	listeners.forEach(listener => {
		listener(memoryState);
	});
}

const autoDismissTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export function toast({ duration = DEFAULT_TOAST_DURATION, ...props }: AddToastOptions) {
	const id = genId();

	const update = (props: ToasterToast) =>
		dispatch({
			type: ToastActionType.UPDATE_TOAST,
			toast: { ...props, id },
		});
	const dismiss = () => {
		// Clear auto-dismiss timeout if exists
		const timeout = autoDismissTimeouts.get(id);
		if (timeout !== undefined) {
			clearTimeout(timeout);
			autoDismissTimeouts.delete(id);
		}
		dispatch({ type: ToastActionType.DISMISS_TOAST, toastId: id });
	};

	dispatch({
		type: ToastActionType.ADD_TOAST,
		toast: {
			...props,
			id,
			open: true,
			onOpenChange: open => {
				if (!open) dismiss();
			},
		},
	});

	// Auto-dismiss after duration (if duration > 0)
	if (duration > 0) {
		const timeout = setTimeout(() => {
			autoDismissTimeouts.delete(id);
			dismiss();
		}, duration);
		autoDismissTimeouts.set(id, timeout);
	}

	return {
		id: id,
		dismiss,
		update,
	};
}

export function useToast() {
	const [state, setState] = useState<ToasterToast[]>(memoryState);

	useEffect(() => {
		listeners.push(setState);
		setState(memoryState);
		return () => {
			const index = listeners.indexOf(setState);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		};
	}, []);

	return {
		toasts: state,
		toast,
		dismiss: (toastId?: string) => dispatch({ type: ToastActionType.DISMISS_TOAST, toastId }),
	};
}

// Helper functions for common toast types
toast.success = (props: ToastHelperProps) => {
	audioService.play(AudioKey.SUCCESS);
	return toast({ ...props, variant: ToastVariant.SUCCESS });
};
toast.error = (props: ToastHelperProps) => {
	audioService.play(AudioKey.ERROR);
	return toast({ ...props, variant: ToastVariant.DESTRUCTIVE });
};
toast.warning = (props: ToastHelperProps) => {
	audioService.play(AudioKey.WARNING);
	return toast({ ...props, variant: ToastVariant.WARNING });
};
toast.info = (props: ToastHelperProps) => {
	audioService.play(AudioKey.NOTIFICATION);
	return toast({ ...props, variant: ToastVariant.INFO });
};
