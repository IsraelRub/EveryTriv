import { useLocation, useNavigate } from 'react-router-dom';

import { VALIDATORS } from '@shared/constants';
import { isRecord } from '@shared/utils';

import { ROUTES } from '@/constants';
import type { UseModalRouteReturn } from '@/types';

export function useModalRoute(): UseModalRouteReturn {
	const location = useLocation();
	const navigate = useNavigate();

	const modalState = (() => {
		const value = location.state;
		if (!isRecord(value)) {
			return null;
		}
		const modal = value.modal;
		const returnUrl = value.returnUrl;
		if (
			(modal === undefined || VALIDATORS.boolean(modal)) &&
			(returnUrl === undefined || VALIDATORS.string(returnUrl))
		) {
			return {
				modal: modal === true,
				...(returnUrl !== undefined && { returnUrl }),
			};
		}
		return null;
	})();
	const isModal = modalState?.modal === true;
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
