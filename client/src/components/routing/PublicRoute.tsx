import { Navigate } from 'react-router-dom';

import { ROUTES } from '@/constants';
import type { PublicRouteProps } from '@/types';
import { useIsAuthenticated } from '@/hooks';

export function PublicRoute({ children }: PublicRouteProps) {
	const isAuthenticated = useIsAuthenticated();

	if (isAuthenticated) {
		return <Navigate to={ROUTES.HOME} replace />;
	}

	return <>{children}</>;
}
