import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Routes } from '@/constants';
import { useCurrentUser } from '@/hooks';

const LEGAL_CONSENT_EXEMPT_PATHS = new Set<string>([
	Routes.LEGAL_ACCEPTANCE,
	Routes.TERMS,
	Routes.PRIVACY,
	Routes.CONTACT,
	Routes.AUTH_CALLBACK,
]);

export function LegalConsentRedirect() {
	const location = useLocation();
	const navigate = useNavigate();
	const { data: user, isLoading, isSuccess } = useCurrentUser();

	useEffect(() => {
		if (isLoading || !isSuccess || !user) {
			return;
		}
		if (user.needsLegalAcceptance !== true) {
			return;
		}
		const path = location.pathname;
		if (LEGAL_CONSENT_EXEMPT_PATHS.has(path)) {
			return;
		}
		navigate(Routes.LEGAL_ACCEPTANCE, { replace: true });
	}, [user, isLoading, isSuccess, location.pathname, navigate]);

	return null;
}
