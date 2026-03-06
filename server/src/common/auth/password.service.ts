import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';

import { ErrorCode } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';
import { createServerError } from '@internal/utils';

@Injectable()
export class PasswordService {
	async hashPassword(password: string, saltRounds: number = 12): Promise<string> {
		try {
			const hashedPassword = await hash(password, saltRounds);

			logger.securityLogin('Password hashed successfully', {
				saltRounds,
			});

			return hashedPassword;
		} catch (error) {
			logger.securityError('Failed to hash password', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw createServerError('hash password', new Error(ErrorCode.PASSWORD_HASH_FAILED));
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
