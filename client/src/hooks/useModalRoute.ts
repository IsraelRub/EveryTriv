import { useLocation, useNavigate } from 'react-router-dom';

import { ROUTES } from '@/constants';
import type { UseModalRouteReturn } from '@/types';
import { isModalRouteState } from '@/utils';

/**
 * Hook for modal route management
 * @description Detects if current route should be displayed as modal and provides close functionality
 * @returns {UseModalRouteReturn} Modal state and close function
 */
export function useModalRoute(): UseModalRouteReturn {
	const location = useLocation();
	const navigate = useNavigate();

	const modalState = isModalRouteState(location.state) ? location.state : null;
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
