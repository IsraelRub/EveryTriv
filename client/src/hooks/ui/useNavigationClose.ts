import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/constants';
import { useModalRoute } from './useModalRoute';

export interface UseNavigationCloseOptions {
	defaultRoute?: string;
	onBeforeClose?: () => void;
}

export function useNavigationClose(options?: UseNavigationCloseOptions) {
	const defaultRoute = options?.defaultRoute ?? ROUTES.HOME;
	const onBeforeCloseRef = useRef(options?.onBeforeClose);

	// Keep ref updated to avoid stale closures
	useEffect(() => {
		onBeforeCloseRef.current = options?.onBeforeClose;
	}, [options?.onBeforeClose]);

	const { isModal, closeModal } = useModalRoute();
	const navigate = useNavigate();

	const handleClose = useCallback(() => {
		// Run callback before closing if provided
		if (onBeforeCloseRef.current) {
			onBeforeCloseRef.current();
		}

		if (isModal) {
			closeModal();
		} else {
			// Try to go back, if no history go to default route
			if (window.history.length > 1) {
				navigate(-1);
			} else {
				navigate(defaultRoute, { replace: true });
			}
		}
	}, [isModal, closeModal, navigate, defaultRoute]);

	return { handleClose, isModal };
}
