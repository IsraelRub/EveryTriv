import { useLocation, useNavigate } from 'react-router-dom';

import type { UseModalRouteReturn } from '@/types/routing/modal.types';

/**
 * Hook for modal route management
 * @description Detects if current route should be displayed as modal and provides close functionality
 * @returns {UseModalRouteReturn} Modal state and close function
 */
export function useModalRoute(): UseModalRouteReturn {
	const location = useLocation();
	const navigate = useNavigate();

	const modalState = location.state as { modal?: boolean; returnUrl?: string } | null;
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
				navigate('/', { replace: true });
			}
		}
	};

	return {
		isModal,
		closeModal,
		returnUrl,
	};
}
