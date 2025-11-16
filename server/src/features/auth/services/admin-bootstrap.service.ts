/**
 * Admin Bootstrap Service
 *
 * @module AdminBootstrapService
 * @description Ensures that a privileged administrator account exists with the correct role
 */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserRole } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import { ensureErrorObject } from '@shared/utils';

import { UserEntity } from '@internal/entities';

import { PasswordService } from '../../../common/auth';
import { AppConfig } from '../../../config/app.config';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly passwordService: PasswordService
	) {}

	/**
	 * Ensure that at least one administrator account exists with the proper role
	 */
	async onModuleInit(): Promise<void> {
		try {
			const { username, email, password } = AppConfig.adminCredentials;
			const defaultAccount = await this.userRepository.findOne({
				where: [{ username }, { email }],
			});

			if (defaultAccount) {
				await this.ensureUserIsAdmin(defaultAccount, password);
				return;
			}

			const adminExists = await this.userRepository.existsBy({ role: UserRole.ADMIN });
			if (adminExists) {
				return;
			}

			await this.createDefaultAdmin(username, email, password);
		} catch (error) {
			const normalizedError = ensureErrorObject(error);
			logger.securityError('Admin bootstrap failed', {
				error: normalizedError.message,
			});
		}
	}

	private async ensureUserIsAdmin(user: UserEntity, password: string | undefined): Promise<void> {
		let hasChanges = false;

		if (user.role !== UserRole.ADMIN) {
			user.role = UserRole.ADMIN;
			hasChanges = true;
		}

		if (!user.passwordHash && password) {
			user.passwordHash = await this.passwordService.hashPassword(password);
			hasChanges = true;
		}

		if (hasChanges) {
			await this.userRepository.save(user);
			logger.securityLogin('Admin account synchronized', {
				userId: user.id,
				username: user.username,
			});
		}
	}

	private async createDefaultAdmin(username: string, email: string, password: string | undefined): Promise<void> {
		if (!password) {
			logger.securityWarn('Default admin password missing. Skipping admin account creation.', {
				username,
				email,
			});
			return;
		}

		const passwordHash = await this.passwordService.hashPassword(password);
		const adminUser = this.userRepository.create({
			username,
			email,
			passwordHash,
			role: UserRole.ADMIN,
			isActive: true,
		});

		const savedUser = await this.userRepository.save(adminUser);

		logger.securityLogin('Default admin account created', {
			userId: savedUser.id,
			username: savedUser.username,
		});
	}
}
