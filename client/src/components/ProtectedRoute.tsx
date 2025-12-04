import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import type { RootState } from '@/types';
import type { ProtectedRouteProps } from '@/types/route.types';

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const { isAuthenticated, currentUser } = useSelector((state: RootState) => state.user);
	const hasRedirected = useRef(false);
	const hasUnauthorizedRedirected = useRef(false);

	useEffect(() => {
		if (isAuthenticated) {
			hasRedirected.current = false;
			hasUnauthorizedRedirected.current = false;
		} else if (!hasRedirected.current) {
			hasRedirected.current = true;
			navigate('/login', { state: { modal: true, returnUrl: location.pathname }, replace: true });
		}
	}, [isAuthenticated, navigate, location.pathname]);

	useEffect(() => {
		if (isAuthenticated && requiredRole && currentUser?.role !== requiredRole && !hasUnauthorizedRedirected.current) {
			hasUnauthorizedRedirected.current = true;
			navigate('/unauthorized', { replace: true });
		}
	}, [isAuthenticated, requiredRole, currentUser?.role, navigate]);

	if (!isAuthenticated) {
		return null;
	}

	if (requiredRole && currentUser?.role !== requiredRole) {
		return null;
	}

	return <>{children}</>;
}
