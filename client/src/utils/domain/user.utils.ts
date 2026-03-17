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
		avatarUrl: p.avatarUrl,
	};
}
