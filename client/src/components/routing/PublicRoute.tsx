import { Navigate, useLocation, useSearchParams } from 'react-router-dom';

import {
	LoadingMessages,
	REGISTER_POST_STEP_AVATAR,
	REGISTER_POST_STEP_QUERY_KEY,
	ROUTES,
} from '@/constants';
import type { PublicRouteProps } from '@/types';
import { FullPageSpinner } from '@/components';
import { useCurrentUser, useHasToken, useIsAuthenticated } from '@/hooks';

export function PublicRoute({ children }: PublicRouteProps) {
	const hasToken = useHasToken();
	const { isLoading: isUserLoading } = useCurrentUser();
	const isAuthenticated = useIsAuthenticated();
	const location = useLocation();
	const [searchParams] = useSearchParams();

	// Avoid flashing login/register while validating an existing session — prevents a failed
	// login attempt from appearing to "succeed" once the user query completes.
	if (hasToken && isUserLoading) {
		return <FullPageSpinner message={LoadingMessages.AUTHENTICATING} showHomeButton={false} />;
	}

	if (isAuthenticated) {
		const isRegisterOptionalAvatarStep =
			location.pathname === ROUTES.REGISTER &&
			searchParams.get(REGISTER_POST_STEP_QUERY_KEY) === REGISTER_POST_STEP_AVATAR;
		if (isRegisterOptionalAvatarStep) {
			return <>{children}</>;
		}
		return <Navigate to={ROUTES.HOME} replace />;
	}

	return <>{children}</>;
}
