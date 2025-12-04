import { useEffect, useState } from 'react';

import { AudioKey } from '@/constants';
import {
	DEFAULT_TOAST_DURATION,
	TOAST_ACTION_TYPES,
	TOAST_LIMIT,
	TOAST_REMOVE_DELAY,
} from '@/constants/ui/toast.constants';
import { audioService } from '@/services';
import type { Action, State, Toast, ToasterToast } from '@/types/hooks/toast.types';

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
			type: TOAST_ACTION_TYPES.REMOVE_TOAST,
			toastId: toastId,
		});
	}, TOAST_REMOVE_DELAY);

	toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
	switch (action.type) {
		case TOAST_ACTION_TYPES.ADD_TOAST:
			return {
				...state,
				toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
			};

		case TOAST_ACTION_TYPES.UPDATE_TOAST:
			return {
				...state,
				toasts: state.toasts.map(t => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
			};

		case TOAST_ACTION_TYPES.DISMISS_TOAST: {
			const { toastId } = action;

			if (toastId) {
				addToRemoveQueue(toastId);
			} else {
				state.toasts.forEach(toast => {
					addToRemoveQueue(toast.id);
				});
			}

			return {
				...state,
				toasts: state.toasts.map(t =>
					t.id === toastId || toastId === undefined
						? {
								...t,
								open: false,
							}
						: t
				),
			};
		}
		case TOAST_ACTION_TYPES.REMOVE_TOAST:
			if (action.toastId === undefined) {
				return {
					...state,
					toasts: [],
				};
			}
			return {
				...state,
				toasts: state.toasts.filter(t => t.id !== action.toastId),
			};
	}
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
	memoryState = reducer(memoryState, action);
	listeners.forEach(listener => {
		listener(memoryState);
	});
}

const autoDismissTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function toast({ duration = DEFAULT_TOAST_DURATION, ...props }: Toast) {
	const id = genId();

	const update = (props: ToasterToast) =>
		dispatch({
			type: TOAST_ACTION_TYPES.UPDATE_TOAST,
			toast: { ...props, id },
		});
	const dismiss = () => {
		// Clear auto-dismiss timeout if exists
		if (autoDismissTimeouts.has(id)) {
			clearTimeout(autoDismissTimeouts.get(id));
			autoDismissTimeouts.delete(id);
		}
		dispatch({ type: TOAST_ACTION_TYPES.DISMISS_TOAST, toastId: id });
	};

	dispatch({
		type: TOAST_ACTION_TYPES.ADD_TOAST,
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

function useToast() {
	const [state, setState] = useState<State>(memoryState);

	useEffect(() => {
		listeners.push(setState);
		return () => {
			const index = listeners.indexOf(setState);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		};
	}, [state]);

	return {
		...state,
		toast,
		dismiss: (toastId?: string) => dispatch({ type: TOAST_ACTION_TYPES.DISMISS_TOAST, toastId }),
	};
}

// Helper functions for common toast types
toast.success = (props: Omit<Toast, 'variant'>) => {
	audioService.play(AudioKey.SUCCESS);
	return toast({ ...props, variant: 'success' });
};
toast.error = (props: Omit<Toast, 'variant'>) => {
	audioService.play(AudioKey.ERROR);
	return toast({ ...props, variant: 'destructive' });
};
toast.warning = (props: Omit<Toast, 'variant'>) => {
	audioService.play(AudioKey.WARNING);
	return toast({ ...props, variant: 'warning' });
};
toast.info = (props: Omit<Toast, 'variant'>) => {
	audioService.play(AudioKey.NOTIFICATION);
	return toast({ ...props, variant: 'info' });
};

export { useToast, toast };
