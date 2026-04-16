import type { ReactElement, ReactNode } from 'react';

import type { UserRole } from '@shared/constants';

export interface AppAuthBootstrapProps {
	children: ReactNode;
}

export interface ProtectedRouteProps {
	children: ReactElement | ReactElement[];
	requiredRole?: UserRole;
	redirectTo?: string;
}

export interface PublicRouteProps {
	children: ReactElement | ReactElement[];
	redirectTo?: string;
}
