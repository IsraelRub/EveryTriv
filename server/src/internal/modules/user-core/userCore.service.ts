import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LogContext, VALIDATION_COUNT } from '@shared/constants';
import type { AdminUserData, AdminUsersListResponse } from '@shared/types';
import { clamp, getErrorMessage } from '@shared/utils';

import { UserEntity } from '@internal/entities';
import { serverLogger as logger } from '@internal/services';

@Injectable()
export class UserCoreService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>
	) {}

	async getAllUsers(
		limit: number = VALIDATION_COUNT.ADMIN_USERS_LIST.DEFAULT_LIMIT,
		offset: number = VALIDATION_COUNT.ADMIN_USERS_LIST.DEFAULT_OFFSET
	): Promise<AdminUsersListResponse> {
		try {
			const safeLimit = clamp(
				limit,
				VALIDATION_COUNT.ADMIN_USERS_LIST.LIMIT_MIN,
				VALIDATION_COUNT.ADMIN_USERS_LIST.LIMIT_MAX
			);
			const safeOffset = Math.max(offset, VALIDATION_COUNT.ADMIN_USERS_LIST.DEFAULT_OFFSET);

			const [users, total] = await this.userRepository.findAndCount({
				where: { isActive: true },
				order: { createdAt: 'DESC' },
				take: safeLimit,
				skip: safeOffset,
			});

			const mapped: AdminUserData[] = users.map(user => ({
				id: user.id,
				email: user.email,
				role: user.role,
				firstName: user.firstName,
				lastName: user.lastName,
				createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
				lastLogin: user.lastLogin ? user.lastLogin.toISOString() : undefined,
			}));

			return {
				users: mapped,
				total,
				limit: safeLimit,
				offset: safeOffset,
				hasMore: safeOffset + mapped.length < total,
			};
		} catch (error) {
			logger.userError('Failed to get all users', {
				context: LogContext.USER_CORE_SERVICE,
				errorInfo: { message: getErrorMessage(error) },
			});
			throw error;
		}
	}

	async getUserById(userId: string): Promise<UserEntity | null> {
		try {
			const user = await this.userRepository.findOne({ where: { id: userId } });
			return user;
		} catch (error) {
			logger.userError('Failed to get user by ID', {
				context: LogContext.USER_CORE_SERVICE,
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			return null;
		}
	}
}
