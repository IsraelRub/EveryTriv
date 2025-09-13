/**
 * Password Service - Centralized password management
 *
 * @module PasswordService
 * @description Unified password hashing and validation service
 * @author EveryTriv Team
 */
import { Injectable } from '@nestjs/common';
import { PasswordConfig, PasswordValidationResult,serverLogger as logger  } from '@shared';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
	private readonly defaultConfig: PasswordConfig = {
		saltRounds: 12,
		minLength: 8,
		maxLength: 128,
		requireUppercase: true,
		requireLowercase: true,
		requireNumbers: true,
		requireSpecialChars: true,
	};
	/**
	 * Hash password with bcrypt
	 */
	async hashPassword(password: string, saltRounds?: number): Promise<string> {
		try {
			const rounds = saltRounds || this.defaultConfig.saltRounds || 10;
			const hashedPassword = await bcrypt.hash(password, rounds);

			logger.securityLogin('Password hashed successfully', {
				saltRounds: rounds,
			});

			return hashedPassword;
		} catch (error) {
			logger.securityError('Failed to hash password', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new Error('Failed to hash password');
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
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return false;
		}
	}

	/**
	 * Validate password strength
	 */
	validatePasswordStrength(password: string, config?: PasswordConfig): PasswordValidationResult {
		const validationConfig = { ...this.defaultConfig, ...config };
		const errors: string[] = [];
		let score = 0;

		// Length validation
		if (password.length < validationConfig.minLength!) {
			errors.push(`Password must be at least ${validationConfig.minLength} characters long`);
		} else {
			score += 1;
		}

		if (password.length > validationConfig.maxLength!) {
			errors.push(`Password must not exceed ${validationConfig.maxLength} characters`);
		}

		// Character requirements
		if (validationConfig.requireUppercase && !/[A-Z]/.test(password)) {
			errors.push('Password must contain at least one uppercase letter');
		} else if (validationConfig.requireUppercase) {
			score += 1;
		}

		if (validationConfig.requireLowercase && !/[a-z]/.test(password)) {
			errors.push('Password must contain at least one lowercase letter');
		} else if (validationConfig.requireLowercase) {
			score += 1;
		}

		if (validationConfig.requireNumbers && !/\d/.test(password)) {
			errors.push('Password must contain at least one number');
		} else if (validationConfig.requireNumbers) {
			score += 1;
		}

		if (validationConfig.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
			errors.push('Password must contain at least one special character');
		} else if (validationConfig.requireSpecialChars) {
			score += 1;
		}

		// Additional strength checks
		if (password.length >= 12) {
			score += 1;
		}

		if (/(.)\1{2,}/.test(password)) {
			errors.push('Password must not contain repeated characters');
		} else {
			score += 1;
		}

		// Common password patterns
		const commonPatterns = [/123456/, /password/i, /qwerty/i, /abc123/i, /admin/i, /letmein/i];

		if (commonPatterns.some(pattern => pattern.test(password))) {
			errors.push('Password contains common patterns and is not secure');
		} else {
			score += 1;
		}

		// Determine strength
		let strength: 'weak' | 'medium' | 'strong' = 'weak';
		if (score >= 6) {
			strength = 'strong';
		} else if (score >= 4) {
			strength = 'medium';
		}

		const isValid = errors.length === 0;

		if (isValid) {
			logger.securityLogin('Password validation successful', {
				strength,
				score,
			});
		} else {
			logger.securityWarn('Password validation failed', {
				errors,
				strength,
				score,
			});
		}

		return {
			isValid,
			errors,
			strength,
			score,
			checks: {
				hasMinLength: password.length >= validationConfig.minLength!,
				hasUppercase: /[A-Z]/.test(password),
				hasLowercase: /[a-z]/.test(password),
				hasNumber: /\d/.test(password),
				hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
			},
		};
	}

	/**
	 * Generate secure random password
	 */
	generateSecurePassword(length: number = 16): string {
		const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
		let password = '';

		// Ensure at least one character from each required type
		password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
		password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
		password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
		password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char

		// Fill the rest randomly
		for (let i = 4; i < length; i++) {
			password += charset[Math.floor(Math.random() * charset.length)];
		}

		// Shuffle the password
		return password
			.split('')
			.sort(() => Math.random() - 0.5)
			.join('');
	}

	/**
	 * Check if password needs to be updated
	 */
	shouldUpdatePassword(lastUpdated: Date, maxAgeDays: number = 90): boolean {
		const now = new Date();
		const daysSinceUpdate = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
		return daysSinceUpdate >= maxAgeDays;
	}

	/**
	 * Hash password with custom salt
	 */
	async hashPasswordWithSalt(password: string, salt: string): Promise<string> {
		try {
			const hashedPassword = await bcrypt.hash(password, salt);

			logger.securityLogin('Password hashed with custom salt');

			return hashedPassword;
		} catch (error) {
			logger.securityError('Failed to hash password with custom salt', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new Error('Failed to hash password with custom salt');
		}
	}

	/**
	 * Get password hash info
	 */
	getPasswordHashInfo(hash: string): { saltRounds: number; algorithm: string } | null {
		try {
			// Extract salt rounds from bcrypt hash
			const saltRounds = parseInt(hash.split('$')[2]);
			return {
				saltRounds,
				algorithm: 'bcrypt',
			};
		} catch (error) {
			logger.securityError('Failed to get password hash info', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			return null;
		}
	}
}
