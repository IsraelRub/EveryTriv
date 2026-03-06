import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ErrorCode, UserStatus } from '@shared/constants';

import { UserEntity } from '@internal/entities';
import { serverLogger as logger } from '@internal/services';
import { isPublicEndpoint } from '@internal/utils';

@Injectable()
export class UserStatusGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);
		const request = context.switchToHttp().getRequest();
		if (isPublic || isPublicEndpoint(request.path ?? '')) {
			return true;
		}

		const requireEmailVerified = this.reflector.getAllAndOverride<boolean>('requireEmailVerified', [
			context.getHandler(),
			context.getClass(),
		]);
		const requireUserStatus = this.reflector.getAllAndOverride<string[]>('requireUserStatus', [
			context.getHandler(),
			context.getClass(),
		]);
		if (!requireEmailVerified && (!requireUserStatus || requireUserStatus.length === 0)) {
			return true;
		}

		const userId = request.user?.sub;
		if (!userId) {
			logger.securityDenied('User status check: no user on request');
			throw new ForbiddenException(ErrorCode.USER_NOT_AUTHENTICATED);
		}

		const user = await this.userRepository.findOne({
			where: { id: userId },
			select: ['id', 'isActive', 'emailVerified'],
		});
		if (!user) {
			throw new ForbiddenException(ErrorCode.USER_NOT_AUTHENTICATED);
		}

		if (requireEmailVerified && !user.emailVerified) {
			logger.securityDenied('Email verification required', { userId });
			throw new ForbiddenException(ErrorCode.EMAIL_VERIFICATION_REQUIRED);
		}

		if (requireUserStatus && requireUserStatus.length > 0) {
			const requiresActive = requireUserStatus.includes(UserStatus.ACTIVE);
			if (requiresActive && !user.isActive) {
				logger.securityDenied('Active user status required', { userId });
				throw new ForbiddenException(ErrorCode.USER_ACCOUNT_DISABLED);
			}
		}

		return true;
	}
}
