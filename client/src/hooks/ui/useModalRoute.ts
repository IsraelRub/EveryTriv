import { useLocation, useNavigate } from 'react-router-dom';

import { isRecord } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { ROUTES } from '@/constants';
import type { UseModalRouteReturn } from '@/types';

function parseModalState(state: unknown): { modal: boolean; returnUrl?: string } | null {
	if (!isRecord(state)) return null;
	const modal = state.modal;
	const returnUrl = state.returnUrl;
	if ((modal === undefined || VALIDATORS.boolean(modal)) && (returnUrl === undefined || VALIDATORS.string(returnUrl))) {
		return {
			modal: !!modal,
			...(returnUrl !== undefined && { returnUrl }),
		};
	}
	return null;
}

export function useModalRoute(): UseModalRouteReturn {
	const location = useLocation();
	const navigate = useNavigate();

	const modalState = parseModalState(location.state);
	const isModal = !!modalState?.modal;
	const returnUrl = modalState?.returnUrl;

	const closeModal = () => {
		if (returnUrl) {
			navigate(returnUrl, { replace: true });
		} else {
			// Try to go back, if no history go to home
			if (window.history.length > 1) {
				navigate(-1);
			} else {
				navigate(ROUTES.HOME, { replace: true });
			}
		}
	};

	return {
		isModal,
		closeModal,
		returnUrl,
	};
}
