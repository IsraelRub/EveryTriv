import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Put, Req } from '@nestjs/common';
import { serverLogger } from 'everytriv-shared/services/logging/serverLogger.service';
import { AuthRequest } from 'everytriv-shared/types/auth.types';
import { UserAddress, UserPreferences, UserPreferencesUpdate } from 'everytriv-shared/types/user.types';

import { UserService } from './user.service';

@Controller('users')
export class UserController {
	constructor(private readonly userService: UserService) {}

	/**
	 * Get user profile
	 */
	@Get('profile')
	async getUserProfile(@Req() req: AuthRequest) {
		try {
			if (!req.user?.id) {
				throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
			}

			return await this.userService.getUserProfile(req.user.id);
		} catch (error) {
			serverLogger.userError('Error getting user profile', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Update user profile
	 */
	@Put('profile')
	async updateUserProfile(
		@Req() req: AuthRequest,
		@Body()
		profileData: {
			username?: string;
			firstName?: string;
			lastName?: string;
			avatar?: string;
			bio?: string;
			dateOfBirth?: Date;
			location?: string;
			website?: string;
			socialLinks?: Record<string, string>;
			preferences?: UserPreferences;
			address?: UserAddress;
		}
	) {
		try {
			if (!req.user?.id) {
				throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
			}

			// Validate profile data
			if (profileData.username && profileData.username.length < 3) {
				throw new HttpException('Username must be at least 3 characters long', HttpStatus.BAD_REQUEST);
			}

			if (profileData.bio && profileData.bio.length > 500) {
				throw new HttpException('Bio must be less than 500 characters', HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.updateUserProfile(req.user.id, profileData);

			// Log API call for profile update
			serverLogger.apiUpdate('user_profile', {
				userId: req.user.id,
				fields: Object.keys(profileData),
			});

			return result;
		} catch (error) {
			serverLogger.userError('Error updating user profile', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Get user statistics
	 */
	@Get('stats')
	async getUserStats(@Req() req: AuthRequest) {
		try {
			if (!req.user?.id) {
				throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
			}

			const result = await this.userService.getUserStats(req.user.id);

			// Log API call for user stats
			serverLogger.apiRead('user_stats', {
				userId: req.user.id,
			});

			return result;
		} catch (error) {
			serverLogger.userError('Error getting user stats', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Search users
	 */
	@Get('search')
	async searchUsers(@Body() body: { query: string; limit?: number }) {
		try {
			if (!body.query) {
				throw new HttpException('Search query is required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.searchUsers(body.query, body.limit || 10);

			// Log API call for user search
			serverLogger.apiRead('user_search', {
				query: body.query,
				limit: body.limit || 10,
				resultsCount: result.totalResults,
			});

			return result;
		} catch (error) {
			serverLogger.userError('Error searching users', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Get user by username
	 */
	@Get('username/:username')
	async getUserByUsername(@Param('username') username: string) {
		try {
			if (!username) {
				throw new HttpException('Username is required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.getUserByUsername(username);

			// Log API call for user by username
			serverLogger.apiRead('user_by_username', {
				username,
			});

			return result;
		} catch (error) {
			serverLogger.userError('Error getting user by username', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Delete user account
	 */
	@Delete('account')
	async deleteUserAccount(@Req() req: AuthRequest) {
		try {
			if (!req.user?.id) {
				throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
			}

			const result = await this.userService.deleteUserAccount(req.user.id);

			// Log API call for account deletion
			serverLogger.apiDelete('user_account', {
				userId: req.user.id,
			});

			return result;
		} catch (error) {
			serverLogger.userError('Error deleting user account', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Update user preferences
	 */
	@Put('preferences')
	async updateUserPreferences(@Req() req: AuthRequest, @Body() preferences: UserPreferencesUpdate) {
		try {
			if (!req.user?.id) {
				throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
			}

			const result = await this.userService.updateUserPreferences(req.user.id, preferences);

			// Log API call for preferences update
			serverLogger.apiUpdate('user_preferences', {
				userId: req.user.id,
				fields: Object.keys(preferences),
			});

			return result;
		} catch (error) {
			serverLogger.userError('Error updating user preferences', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
