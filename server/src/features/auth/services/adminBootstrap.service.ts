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
import { ensureErrorObject } from '@shared/utils';

import { UserEntity } from '@internal/entities';
import { serverLogger as logger } from '@internal/services';

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
		const maxRetries = 5;
		const retryDelay = 2000;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const { email, password } = AppConfig.adminCredentials;
				const defaultAccount = await this.userRepository.findOne({
					where: { email },
				});

				if (defaultAccount) {
					await this.ensureUserIsAdmin(defaultAccount, password);
					return;
				}

				const adminExists = await this.userRepository.existsBy({ role: UserRole.ADMIN });
				if (adminExists) {
					return;
				}

				await this.createDefaultAdmin(email, password);
				return;
			} catch (error) {
				const normalizedError = ensureErrorObject(error);
				const isTableNotExistsError =
					normalizedError.message.includes('does not exist') || normalizedError.message.includes('relation');

				if (isTableNotExistsError && attempt < maxRetries) {
					logger.securityWarn(`Admin bootstrap retry attempt ${attempt}/${maxRetries} - tables not ready yet`, {
						error: normalizedError.message,
					});
					await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
					continue;
				}

				logger.securityError('Admin bootstrap failed', {
					error: normalizedError.message,
					attempt,
					maxRetries,
				});
				break;
			}
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
				email: user.email,
			});
		}
	}

	private async createDefaultAdmin(email: string, password: string | undefined): Promise<void> {
		if (!password) {
			logger.securityWarn('Default admin password missing. Skipping admin account creation.', {
				email,
			});
			return;
		}

		const passwordHash = await this.passwordService.hashPassword(password);
		const adminUser = this.userRepository.create({
			email,
			passwordHash,
			role: UserRole.ADMIN,
			isActive: true,
		});

		const savedUser = await this.userRepository.save(adminUser);

		logger.securityLogin('Default admin account created', {
			userId: savedUser.id,
			email: savedUser.email,
		});
	}
}
