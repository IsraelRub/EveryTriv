import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LogContext } from '@shared/constants';
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

	async getAllUsers(limit: number = 50, offset: number = 0): Promise<AdminUsersListResponse> {
		try {
			const safeLimit = clamp(limit, 1, 200);
			const safeOffset = Math.max(offset, 0);

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
