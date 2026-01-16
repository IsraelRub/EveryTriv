import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { TIME_PERIODS_MS, UserRole, VALIDATION_COUNT } from '@shared/constants';
import { ensureErrorObject } from '@shared/utils';

import { AppConfig } from '@config';
import { UserEntity } from '@internal/entities';
import { serverLogger as logger } from '@internal/services';

import { PasswordService } from '../../common/auth';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly passwordService: PasswordService,
		@InjectDataSource()
		private readonly dataSource: DataSource
	) {}

	async onModuleInit(): Promise<void> {
		const maxRetries = VALIDATION_COUNT.RETRY_ATTEMPTS.ADMIN_BOOTSTRAP;
		const retryDelay = TIME_PERIODS_MS.TWO_SECONDS;

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

				const adminExists = await this.userRepository.existsBy({
					role: UserRole.ADMIN,
				});
				if (adminExists) {
					return;
				}

				await this.createDefaultAdmin(email, password);
				return;
			} catch (error) {
				const normalizedError = ensureErrorObject(error);
				const isDatabaseNotReady = !(await this.isDatabaseReady());

				if (isDatabaseNotReady && attempt < maxRetries) {
					logger.securityWarn(`Admin bootstrap retry attempt ${attempt}/${maxRetries} - database not ready yet`, {
						errorInfo: { message: normalizedError.message },
					});
					await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
					continue;
				}

				logger.securityError('Admin bootstrap failed', {
					errorInfo: { message: normalizedError.message },
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
				emails: { current: user.email },
			});
		}
	}

	private async createDefaultAdmin(email: string, password: string | undefined): Promise<void> {
		if (!password) {
			logger.securityWarn('Default admin password missing. Skipping admin account creation.', {
				emails: { current: email },
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
			emails: { current: savedUser.email },
		});
	}

	private async isDatabaseReady(): Promise<boolean> {
		try {
			if (!this.dataSource.isInitialized) {
				return false;
			}
			await this.dataSource.query('SELECT 1');
			return true;
		} catch {
			return false;
		}
	}
}
