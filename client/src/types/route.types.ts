/**
 * Authentication Route Types
 *
 * @module AuthRouteTypes
 * @description Type definitions for authentication-related route components
 */
import { ReactNode } from 'react';

import type { UserRole } from '@shared/constants';

/**
 * Props for ProtectedRoute component
 * @interface ProtectedRouteProps
 * @description Configuration for routes that require authentication
 */
export interface ProtectedRouteProps {
	children: ReactNode;
	requiredRole?: UserRole;
	redirectTo?: string;
}

/**
 * Props for PublicRoute component
 * @interface PublicRouteProps
 * @description Configuration for routes that should only be accessible to unauthenticated users
 */
export interface PublicRouteProps {
	children: ReactNode;
	redirectTo?: string;
}
