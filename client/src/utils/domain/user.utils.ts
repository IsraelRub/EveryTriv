import type { BasicUser, UserProfileResponseType } from '@shared/types';

export function profileResponseToBasicUser(profileResponse: UserProfileResponseType): BasicUser {
	const p = profileResponse.profile;
	return {
		id: p.id,
		email: p.email,
		role: p.role,
		firstName: p.firstName,
		lastName: p.lastName,
		avatar: p.avatar,
	};
}

export const getUserInitials = (firstName?: string | null, lastName?: string | null, email?: string | null): string => {
	if (firstName && lastName) {
		return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
	}
	if (firstName) {
		return firstName.charAt(0).toUpperCase();
	}
	if (email) {
		return email.charAt(0).toUpperCase();
	}
	return 'U';
};
