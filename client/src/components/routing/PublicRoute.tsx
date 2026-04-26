import { Navigate } from 'react-router-dom';

import { LoadingMessages, Routes } from '@/constants';
import type { PublicRouteProps } from '@/types';
import { FullPageSpinner } from '@/components';
import { useCurrentUser, useHasToken, useIsAuthenticated } from '@/hooks';

export function PublicRoute({ children }: PublicRouteProps) {
	const hasToken = useHasToken();
	const { isLoading: isUserLoading } = useCurrentUser();
	const isAuthenticated = useIsAuthenticated();

	// Avoid flashing login/register while validating an existing session — prevents a failed
	// login attempt from appearing to "succeed" once the user query completes.
	if (hasToken && isUserLoading) {
		return <FullPageSpinner message={LoadingMessages.AUTHENTICATING} showHomeButton={false} />;
	}

	if (isAuthenticated) {
		return <Navigate to={Routes.HOME} replace />;
	}

	return <>{children}</>;
}
