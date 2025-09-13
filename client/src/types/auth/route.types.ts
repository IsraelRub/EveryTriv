/**
 * Authentication Route Types
 *
 * @module AuthRouteTypes
 * @description Type definitions for authentication-related route components
 */
import type { User } from '@shared';
import { ReactNode } from 'react';

/**
 * Props for ProtectedRoute component
 * @interface ProtectedRouteProps
 * @description Configuration for routes that require authentication
 */
export interface ProtectedRouteProps {
  /** Child components to render if authenticated */
  children: ReactNode;
  /** Required user role for access (optional) */
  requiredRole?: string;
  /** Custom redirect path for unauthenticated users (defaults to '/login') */
  redirectTo?: string;
}

/**
 * Props for PublicRoute component
 * @interface PublicRouteProps
 * @description Configuration for routes that should only be accessible to unauthenticated users
 */
export interface PublicRouteProps {
  /** Child components to render if not authenticated */
  children: ReactNode;
  /** Custom redirect path for authenticated users (defaults to '/') */
  redirectTo?: string;
}

/**
 * Authentication state for route protection
 * @interface AuthRouteState
 * @description State information used by authentication route components
 */
export interface AuthRouteState {
  /** Whether user is currently authenticated */
  isAuthenticated: boolean;
  /** Current user object (if authenticated) - using proper User type */
  user: User | null;
  /** Current location pathname */
  pathname: string;
}
