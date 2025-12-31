import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { ROUTES } from '@/constants';
import type { ProtectedRouteProps, RootState } from '@/types';

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const { isAuthenticated, currentUser, isLoading } = useSelector((state: RootState) => state.user);
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
		if (isAuthenticated && requiredRole && currentUser?.role !== requiredRole && !hasUnauthorizedRedirected.current) {
			hasUnauthorizedRedirected.current = true;
			navigate(ROUTES.UNAUTHORIZED, { replace: true });
		}
	}, [isAuthenticated, requiredRole, currentUser?.role, navigate]);

	if (isLoading || !isAuthenticated) {
		return null;
	}

	if (requiredRole && currentUser?.role !== requiredRole) {
		return null;
	}

	return <>{children}</>;
}
