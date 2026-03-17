import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

import { USER_ROLES, UserRole } from '@shared/constants';

import { AppConfig } from '@config';
import { UserEntity } from '@internal/entities';
import type { AuthenticatedUserPayload, TokenPayload } from '@internal/types';

export async function resolveAuthenticatedUser(
	token: string,
	jwtService: JwtService,
	userRepository: Repository<UserEntity>
): Promise<AuthenticatedUserPayload> {
	const payload = await jwtService.verifyAsync<TokenPayload>(token, {
		secret: AppConfig.jwt.secret,
	});

	const dbUser = await userRepository.findOne({
		where: { id: payload.sub },
		select: ['id', 'role'],
	});

	return {
		...payload,
		role: dbUser?.role ?? (USER_ROLES.has(payload.role) ? payload.role : UserRole.USER),
	};
}
