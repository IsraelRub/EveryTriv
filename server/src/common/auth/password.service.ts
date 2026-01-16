import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';

import { ERROR_CODES } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';
import { createServerError } from '@internal/utils';

@Injectable()
export class PasswordService {
	async hashPassword(password: string, saltRounds?: number): Promise<string> {
		try {
			const rounds = saltRounds ?? 12;
			const hashedPassword = await hash(password, rounds);

			logger.securityLogin('Password hashed successfully', {
				saltRounds: rounds,
			});

			return hashedPassword;
		} catch (error) {
			logger.securityError('Failed to hash password', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw createServerError('hash password', new Error(ERROR_CODES.PASSWORD_HASH_FAILED));
		}
	}

	async comparePassword(password: string, hash: string): Promise<boolean> {
		try {
			const isMatch = await compare(password, hash);

			if (isMatch) {
				logger.securityLogin('Password comparison successful');
			} else {
				logger.securityDenied('Password comparison failed');
			}

			return isMatch;
		} catch (error) {
			logger.securityError('Failed to compare password', {
				errorInfo: { message: getErrorMessage(error) },
			});
			return false;
		}
	}
}
