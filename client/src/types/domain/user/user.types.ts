import type { UserRole } from '@shared/constants';

export interface UseUserRoleReturn {
	role: UserRole | undefined;
	isAdmin: boolean;
}

export interface CompleteProfileParams {
	firstName: string;
	lastName?: string;
}
