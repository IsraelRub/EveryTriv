import type { BasicUser, UserProfile } from '@shared/types';

export function userProfileToBasicUser(profile: UserProfile): BasicUser {
	return {
		id: profile.id,
		email: profile.email,
		role: profile.role,
		firstName: profile.firstName,
		lastName: profile.lastName,
		avatar: profile.avatar,
		avatarUrl: profile.avatarUrl,
		emailVerified: profile.emailVerified,
	};
}
