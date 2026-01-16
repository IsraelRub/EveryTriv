import { Navigate } from 'react-router-dom';

import { ROUTES } from '@/constants';
import { useIsAuthenticated } from '@/hooks';
import type { PublicRouteProps } from '@/types';

export function PublicRoute({ children }: PublicRouteProps) {
	const isAuthenticated = useIsAuthenticated();

	if (isAuthenticated) {
		return <Navigate to={ROUTES.HOME} replace />;
	}

	return <>{children}</>;
}
