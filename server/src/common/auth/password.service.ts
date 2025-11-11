/**
 * Password Service - Centralized password management
 *
 * @module PasswordService
 * @description password hashing and validation service
 * @author EveryTriv Team
 */
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { serverLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import { createServerError } from '@internal/utils';

@Injectable()
export class PasswordService {
	/**
	 * Hash password with bcrypt
	 */
	async hashPassword(password: string, saltRounds?: number): Promise<string> {
		try {
			const rounds = saltRounds ?? 12;
			const hashedPassword = await bcrypt.hash(password, rounds);

			logger.securityLogin('Password hashed successfully', {
				saltRounds: rounds,
			});

			return hashedPassword;
		} catch (error) {
			logger.securityError('Failed to hash password', {
				error: getErrorMessage(error),
			});
			throw createServerError('hash password', new Error('Failed to hash password'));
		}
	}

	/**
	 * Compare password with hash
	 */
	async comparePassword(password: string, hash: string): Promise<boolean> {
		try {
			const isMatch = await bcrypt.compare(password, hash);

			if (isMatch) {
				logger.securityLogin('Password comparison successful');
			} else {
				logger.securityDenied('Password comparison failed');
			}

			return isMatch;
		} catch (error) {
			logger.securityError('Failed to compare password', {
				error: getErrorMessage(error),
			});
			return false;
		}
	}
}
