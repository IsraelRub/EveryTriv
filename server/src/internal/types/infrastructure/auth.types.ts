import { UserRole } from '@shared/constants';

export interface TokenUserData {
	id: string;
	email: string;
	role: UserRole;
}
