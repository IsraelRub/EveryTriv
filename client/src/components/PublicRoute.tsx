import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import { ROUTES } from '@/constants';
import type { PublicRouteProps, RootState } from '@/types';

export function PublicRoute({ children }: PublicRouteProps) {
	const { isAuthenticated } = useSelector((state: RootState) => state.user);

	if (isAuthenticated) {
		return <Navigate to={ROUTES.HOME} replace />;
	}

	return <>{children}</>;
}
