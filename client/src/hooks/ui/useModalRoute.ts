import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { isNonEmptyString, isRecord } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { ROUTES } from '@/constants';
import type { UseModalRouteReturn } from '@/types';
import { isProtectedAppPath } from '@/utils';
import { useIsAuthenticated } from '../useAuth';

function parseModalState(state: unknown): { modal: boolean; returnUrl?: string } | null {
	if (!isRecord(state)) return null;
	const modal = state.modal;
	const returnUrl = state.returnUrl;
	if ((modal === undefined || VALIDATORS.boolean(modal)) && (returnUrl === undefined || isNonEmptyString(returnUrl))) {
		return {
			modal: !!modal,
			...(isNonEmptyString(returnUrl) && { returnUrl }),
		};
	}
	return null;
}

export function useModalRoute(): UseModalRouteReturn {
	const location = useLocation();
	const navigate = useNavigate();
	const isAuthenticated = useIsAuthenticated();

	const modalState = parseModalState(location.state);
	const isModal = !!modalState?.modal;
	const returnUrl = modalState?.returnUrl;

	const closeModal = useCallback(() => {
		const safeReturnUrl = returnUrl && !isAuthenticated && isProtectedAppPath(returnUrl) ? ROUTES.HOME : returnUrl;

		if (safeReturnUrl) {
			navigate(safeReturnUrl, { replace: true });
		} else if (window.history.length > 1) {
			navigate(-1);
		} else {
			navigate(ROUTES.HOME, { replace: true });
		}
	}, [returnUrl, isAuthenticated, navigate]);

	return {
		isModal,
		closeModal,
		returnUrl,
	};
}
