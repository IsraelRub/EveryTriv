import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ROUTES } from '@/constants';
import { useCurrentUser, useIsAuthenticated, useUserRole } from '@/hooks';
import type { ProtectedRouteProps } from '@/types';

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const isAuthenticated = useIsAuthenticated();
	const { isLoading } = useCurrentUser();
	const userRole = useUserRole();
	const hasRedirected = useRef(false);
	const hasUnauthorizedRedirected = useRef(false);

	useEffect(() => {
		if (isAuthenticated) {
			hasRedirected.current = false;
			hasUnauthorizedRedirected.current = false;
		} else if (!isLoading && !hasRedirected.current) {
			hasRedirected.current = true;
			navigate(ROUTES.LOGIN, { state: { modal: true, returnUrl: location.pathname }, replace: true });
		}
	}, [isAuthenticated, isLoading, navigate, location.pathname]);

	useEffect(() => {
		if (isAuthenticated && requiredRole && userRole !== requiredRole && !hasUnauthorizedRedirected.current) {
			hasUnauthorizedRedirected.current = true;
			navigate(ROUTES.UNAUTHORIZED, { replace: true });
		}
	}, [isAuthenticated, requiredRole, userRole, navigate]);

	if (isLoading || !isAuthenticated) {
		return null;
	}

	if (requiredRole && userRole !== requiredRole) {
		return null;
	}

	return <>{children}</>;
}
