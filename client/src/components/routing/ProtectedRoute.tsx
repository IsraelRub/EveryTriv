import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Routes } from '@/constants';
import type { ProtectedRouteProps } from '@/types';
import { useCurrentUser, useIsAuthenticated, useUserRole } from '@/hooks';

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const isAuthenticated = useIsAuthenticated();
	const { isLoading } = useCurrentUser();
	const { role: userRole } = useUserRole();
	const hasRedirected = useRef(false);
	const hasUnauthorizedRedirected = useRef(false);

	useEffect(() => {
		if (isAuthenticated) {
			hasRedirected.current = false;
			hasUnauthorizedRedirected.current = false;
		} else if (!isLoading && !hasRedirected.current) {
			hasRedirected.current = true;
			navigate(Routes.LOGIN, {
				state: { modal: true, returnUrl: `${location.pathname}${location.search}` },
				replace: true,
			});
		}
	}, [isAuthenticated, isLoading, navigate, location.pathname, location.search]);

	useEffect(() => {
		if (isAuthenticated && requiredRole && userRole !== requiredRole && !hasUnauthorizedRedirected.current) {
			hasUnauthorizedRedirected.current = true;
			navigate(Routes.UNAUTHORIZED, { replace: true });
		}
	}, [isAuthenticated, requiredRole, userRole, navigate]);

	if (isLoading || !isAuthenticated || (requiredRole != null && userRole !== requiredRole)) {
		return null;
	}

	return <>{children}</>;
}
