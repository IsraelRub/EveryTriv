/**
 * Protected Route Component
 *
 * @module ProtectedRoute
 * @description Higher Order Component for protecting routes that require authentication
 * @used_by client/src/AppRoutes.tsx for protecting sensitive routes
 */
import { memo } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

import { clientLogger as logger } from '@shared/services';

import { CLIENT_STORAGE_KEYS } from '../constants';
import type { ProtectedRouteProps, PublicRouteProps, RootState } from '../types';

/**
 * Protected Route Component
 * Wraps components that require authentication
 *
 * @component ProtectedRoute
 * @description HOC that checks authentication status and redirects if not authenticated
 * @param children - The component to protect
 * @param requiredRole - Optional role requirement
 * @param redirectTo - Custom redirect path (defaults to '/login')
 * @returns JSX.Element Protected component or redirect
 */
export const ProtectedRoute = memo(function ProtectedRoute({
	children,
	requiredRole,
	redirectTo = '/login',
}: ProtectedRouteProps) {
	const { isAuthenticated, currentUser } = useSelector((state: RootState) => state.user);
	const location = useLocation();
	const requiredRoles = requiredRole ? [requiredRole] : undefined;

	logger.navigationRoute('protected-route-check', {
		path: location.pathname,
		isAuthenticated,
		role: currentUser?.role,
		requiredRoles,
	});

	if (!isAuthenticated) {
		logger.securityDenied('Unauthenticated access attempt', {
			path: location.pathname,
			redirectTo,
		});

		sessionStorage.setItem(CLIENT_STORAGE_KEYS.REDIRECT_AFTER_LOGIN, location.pathname);

		return <Navigate to={redirectTo} state={{ from: location }} replace />;
	}

	if (requiredRole && currentUser?.role !== requiredRole) {
		logger.securityDenied('Insufficient permissions', {
			path: location.pathname,
			role: currentUser?.role,
			requiredRoles,
		});

		return <Navigate to='/unauthorized' replace />;
	}

	logger.navigationRoute('protected-route-granted', {
		path: location.pathname,
		role: currentUser?.role,
	});

	return <>{children}</>;
});

/**
 * Public Route Component
 * Wraps components that should only be accessible to unauthenticated users
 *
 * @component PublicRoute
 * @description HOC that redirects authenticated users away from public routes
 * @param children - The component to protect
 * @param redirectTo - Where to redirect authenticated users (defaults to '/')
 * @returns JSX.Element Public component or redirect
 */
export const PublicRoute = memo(function PublicRoute({ children, redirectTo = '/' }: PublicRouteProps) {
	const { isAuthenticated } = useSelector((state: RootState) => state.user) as {
		isAuthenticated: boolean;
	};
	const location = useLocation();

	logger.navigationRoute('public-route-access', {
		path: location.pathname,
		isAuthenticated,
	});

	if (isAuthenticated) {
		logger.navigationRedirect('public-route', 'authenticated-redirect', {
			path: location.pathname,
			redirectTo,
		});

		return <Navigate to={redirectTo} replace />;
	}

	return <>{children}</>;
});
