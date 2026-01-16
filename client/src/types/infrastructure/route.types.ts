import { ReactNode } from 'react';

import type { UserRole } from '@shared/constants';

export interface ProtectedRouteProps {
	children: ReactNode;
	requiredRole?: UserRole;
	redirectTo?: string;
}

export interface PublicRouteProps {
	children: ReactNode;
	redirectTo?: string;
}
