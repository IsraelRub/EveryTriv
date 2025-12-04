import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import type { RootState } from '@/types';
import type { PublicRouteProps } from '@/types/route.types';

export function PublicRoute({ children }: PublicRouteProps) {
	const { isAuthenticated } = useSelector((state: RootState) => state.user);

	if (isAuthenticated) {
		return <Navigate to='/' replace />;
	}

	return <>{children}</>;
}
