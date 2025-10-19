/**
 * Authentication Route Types
 *
 * @module AuthRouteTypes
 * @description Type definitions for authentication-related route components
 */
import type { User } from '@shared/types';
import { ReactNode } from 'react';

/**
 * Props for ProtectedRoute component
 * @interface ProtectedRouteProps
 * @description Configuration for routes that require authentication
 */
export interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
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

/**
 * Authentication state for route protection
 * @interface AuthRouteState
 * @description State information used by authentication route components
 */
export interface AuthRouteState {
  isAuthenticated: boolean;
  user: User | null;
  pathname: string;
}
