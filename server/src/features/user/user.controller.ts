import {
	Body,
	Controller,
	Delete,
	Get,
	HttpException,
	HttpStatus,
	Param,
	Patch,
	Post,
	Put,
	Query,
	UsePipes,
} from '@nestjs/common';
import { serverLogger as logger } from '@shared/services';
import type { AdminUserData, UserFieldUpdate, BasicUser } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { UserRole, UserStatus, CACHE_DURATION, PERFORMANCE_THRESHOLDS, STRING_LIMITS, PAGINATION_LIMITS, VALIDATION_ERRORS } from '@shared/constants';

import {
	AuditLog,
	Cache,
	ClientIP,
	CurrentUser,
	CurrentUserId,
	PerformanceThreshold,
	RequireEmailVerified,
	RequireUserStatus,
	Roles,
	UserActivityLog,
	UserAgent,
} from '../../common';
import { UserDataPipe } from '../../common/pipes';
import {
	DeductCreditsDto,
	SearchUsersDto,
	UpdateSinglePreferenceDto,
	UpdateUserCreditsDto,
	UpdateUserFieldDto,
	UpdateUserPreferencesDto,
	UpdateUserProfileDto,
	UpdateUserStatusDto,
} from './dtos';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
	constructor(private readonly userService: UserService) {}

	/**
	 * Get user profile
	 */
	@Get('profile')
	@Cache(CACHE_DURATION.MEDIUM)
	async getUserProfile(@CurrentUser() user: BasicUser) {
		try {
			const result = await this.userService.getUserProfile(user.id);

			// Log API call
			logger.apiRead('user_profile', {
				userId: user.id,
			});

			return result;
		} catch (error) {
			logger.userError('Error getting user profile', {
				error: getErrorMessage(error),
				userId: user.id,
			});
			throw error;
		}
	}

	/**
	 * Get user credits
	 */
	@Get('credits')
	@Cache(CACHE_DURATION.VERY_SHORT)
	async getUserCredits(@CurrentUserId() userId: string) {
		try {
			const credits = await this.userService.getUserCredits(userId);

			// Log API call
			logger.apiRead('user_credits', {
				userId,
			});

			return { credits };
		} catch (error) {
			logger.userError('Error getting user credits', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Deduct user credits
	 */
	@Post('credits')
	async deductCredits(@CurrentUserId() userId: string, @Body() body: DeductCreditsDto) {
		try {
			const result = await this.userService.deductCredits(userId, body.amount, body.reason || 'Game play');

			// Log API call
			logger.apiUpdate('user_credits_deduct', {
				userId,
				amount: body.amount,
				reason: body.reason || 'Game play',
			});

			return result;
		} catch (error) {
			logger.userError('Error deducting credits', {
				error: getErrorMessage(error),
				userId,
				amount: body.amount,
			});
			throw error;
		}
	}

	/**
	 * Update user profile
	 */
	@Put('profile')
	@UsePipes(UserDataPipe)
	@RequireEmailVerified()
	@RequireUserStatus('active')
	@PerformanceThreshold(PERFORMANCE_THRESHOLDS.SLOW)
	@AuditLog('user:update-profile')
	@UserActivityLog('user:profile-update')
	async updateUserProfile(
		@CurrentUserId() userId: string,
		@Body() profileData: UpdateUserProfileDto,
		@ClientIP() ip: string,
		@UserAgent() userAgent: string
	) {
		try {
			const result = await this.userService.updateUserProfile(userId, profileData);

			// Log API call for profile update
			logger.apiUpdate('user_profile', {
				userId,
				fields: Object.keys(profileData),
				ip,
				userAgent,
			});

			return result;
		} catch (error) {
			logger.userError('Error updating user profile', {
				error: getErrorMessage(error),
				userId,
				fields: Object.keys(profileData),
			});
			throw error;
		}
	}

	/**
	 * Search users
	 */
	@Get('search')
	@Cache(CACHE_DURATION.MEDIUM) // Cache search results for 5 minutes
	async searchUsers(@Query() query: SearchUsersDto) {
		try {
			const result = await this.userService.searchUsers(query.query, query.limit || PAGINATION_LIMITS.DEFAULT);

			// Log API call for user search
			logger.apiRead('user_search', {
				query: query.query,
				limit: query.limit || PAGINATION_LIMITS.DEFAULT,
				resultsCount: result.totalResults,
			});

			return result;
		} catch (error) {
			logger.userError('Error searching users', {
				error: getErrorMessage(error),
				query: query.query,
				limit: query.limit || PAGINATION_LIMITS.DEFAULT,
			});
			throw error;
		}
	}

	/**
	 * Get user by username
	 */
	@Get('username/:username')
	@Cache(CACHE_DURATION.LONG) // Cache for 10 minutes
	async getUserByUsername(@Param('username') username: string) {
		try {
			if (!username) {
				throw new HttpException(VALIDATION_ERRORS.REQUIRED_USERNAME, HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.getUserByUsername(username);

			// Log API call for user by username
			logger.apiRead('user_by_username', {
				username,
			});

			return result;
		} catch (error) {
			logger.userError('Error getting user by username', {
				error: getErrorMessage(error),
				username,
			});
			throw error;
		}
	}

	/**
	 * Delete user account
	 */
	@Delete('account')
	@AuditLog('user:delete-account')
	@UserActivityLog('user:account-deletion')
	async deleteUserAccount(@CurrentUserId() userId: string) {
		try {
			const result = await this.userService.deleteUserAccount(userId);

			// Log API call for account deletion
			logger.apiDelete('user_account', {
				userId,
			});

			return result;
		} catch (error) {
			logger.userError('Error deleting user account', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Update user preferences
	 */
	@Put('preferences')
	@UserActivityLog('user:preferences-update')
	async updateUserPreferences(@CurrentUserId() userId: string, @Body() preferences: UpdateUserPreferencesDto) {
		try {
			const result = await this.userService.updateUserPreferences(userId, preferences as Record<string, unknown>);

			// Log API call for preferences update
			logger.apiUpdate('user_preferences', {
				userId,
				fields: Object.keys(preferences),
			});

			return result;
		} catch (error) {
			logger.userError('Error updating user preferences', {
				error: getErrorMessage(error),
				userId,
				fields: Object.keys(preferences),
			});
			throw error;
		}
	}

	/**
	 * Update specific user field
	 */
	@Patch('profile/:field')
	@UserActivityLog('user:field-update')
	async updateUserField(
		@CurrentUserId() userId: string,
		@Param('field') field: string,
		@Body() body: UpdateUserFieldDto
	) {
		try {
			if (!field || !body.value) {
				throw new HttpException(VALIDATION_ERRORS.REQUIRED_FIELD_AND_VALUE, HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.updateUserField(userId, field as keyof UserFieldUpdate, body.value);

			// Log API call for field update
			logger.apiUpdate('user_field', {
				userId,
				field,
				value: typeof body.value === 'string' ? body.value.substring(0, STRING_LIMITS.SHORT) : body.value,
			});

			return result;
		} catch (error) {
			logger.userError('Error updating user field', {
				error: getErrorMessage(error),
				userId,
				field,
			});
			throw error;
		}
	}

	/**
	 * Update single preference
	 */
	@Patch('preferences/:preference')
	@UserActivityLog('user:single-preference-update')
	async updateSinglePreference(
		@CurrentUserId() userId: string,
		@Param('preference') preference: string,
		@Body() body: UpdateSinglePreferenceDto
	) {
		try {
			if (!preference || body.value === undefined) {
				throw new HttpException(VALIDATION_ERRORS.REQUIRED_PREFERENCE_AND_VALUE, HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.updateSinglePreference(userId, preference, body.value);

			// Log API call for single preference update
			logger.apiUpdate('user_single_preference', {
				userId,
				preference,
				value: typeof body.value === 'string' ? body.value.substring(0, 50) : body.value,
			});

			return result;
		} catch (error) {
			logger.userError('Error updating single preference', {
				error: getErrorMessage(error),
				userId,
				preference,
			});
			throw error;
		}
	}

	/**
	 * Get user by ID (for admins)
	 */
	@Get(':id')
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getUserById(@Param('id') id: string) {
		try {
			if (!id) {
				throw new HttpException(VALIDATION_ERRORS.REQUIRED_USER_ID, HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.getUserById(id);

			// Log API call for user by ID
			logger.apiRead('user_by_id', {
				userId: id,
			});

			return result;
		} catch (error) {
			logger.userError('Error getting user by ID', {
				error: getErrorMessage(error),
				userId: id,
			});
			throw error;
		}
	}

	/**
	 * Update user credits (for admins)
	 */
	@Put('credits/:userId')
	@Roles(UserRole.ADMIN)
	@AuditLog('admin:update-user-credits')
	async updateUserCredits(@Param('userId') userId: string, @Body() creditsData: UpdateUserCreditsDto) {
		try {
			if (!userId || !creditsData.amount || !creditsData.reason) {
				throw new HttpException(VALIDATION_ERRORS.REQUIRED_AMOUNT_AND_REASON, HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.updateUserCredits(userId, creditsData.amount, creditsData.reason);

			// Log API call for credits update
			logger.apiUpdate('user_credits_admin', {
				userId,
				amount: creditsData.amount,
				reason: creditsData.reason,
			});

			return result;
		} catch (error) {
			logger.userError('Error updating user credits', {
				error: getErrorMessage(error),
				userId,
				amount: creditsData.amount,
			});
			throw error;
		}
	}

	/**
	 * Delete user (for admins)
	 */
	@Delete(':userId')
	@Roles(UserRole.ADMIN)
	@AuditLog('admin:delete-user')
	async deleteUser(@Param('userId') userId: string) {
		try {
			if (!userId) {
				throw new HttpException(VALIDATION_ERRORS.REQUIRED_USER_ID, HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.deleteUserAccount(userId);

			// Log API call for user deletion
			logger.apiDelete('user_admin_delete', {
				userId,
			});

			return result;
		} catch (error) {
			logger.userError('Error deleting user', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Update user status (for admins)
	 */
	@Patch(':userId/status')
	@Roles(UserRole.ADMIN)
	@AuditLog('admin:update-user-status')
	async updateUserStatus(@Param('userId') userId: string, @Body() statusData: UpdateUserStatusDto) {
		try {
			if (!userId || !statusData.status) {
				throw new HttpException(VALIDATION_ERRORS.REQUIRED_USER_ID_AND_STATUS, HttpStatus.BAD_REQUEST);
			}

		const validStatuses = Object.values(UserStatus);
			if (!validStatuses.includes(statusData.status)) {
				throw new HttpException(VALIDATION_ERRORS.INVALID_STATUS, HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.updateUserStatus(userId, statusData.status);

			// Log API call for status update
			logger.apiUpdate('user_status_admin', {
				userId,
				status: statusData.status,
			});

			return result;
		} catch (error) {
			logger.userError('Error updating user status', {
				error: getErrorMessage(error),
				userId,
				status: statusData.status,
			});
			throw error;
		}
	}

	/**
	 * Admin endpoint - get all users (admin only)
	 */
	@Get('admin/all')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getAllUsers(@CurrentUser() user: BasicUser) {
		try {
			// This would call a service method to get all users
			const users: AdminUserData[] = [];

			// Log API call
			logger.apiRead('admin_get_all_users', {
				adminId: user.id,
				adminRole: user.role,
				usersCount: users.length,
			});

			return {
				adminUser: {
					id: user.id,
					username: user.username,
					email: user.email,
					role: user.role,
					createdAt: new Date().toISOString(),
				},
				users: users,
			};
		} catch (error) {
			logger.userError('Failed to get all users', {
				error: getErrorMessage(error),
				adminId: user.id,
				adminRole: user.role,
			});
			throw error;
		}
	}

	/**
	 * Admin endpoint - update user status (admin only)
	 */
	@Put('admin/:userId/status')
	@Roles(UserRole.ADMIN)
	@AuditLog('admin:update-user-status')
	async adminUpdateUserStatus(
		@CurrentUser() adminUser: BasicUser,
		@Param('userId') userId: string,
		@Body() statusData: UpdateUserStatusDto
	) {
		try {
			if (!userId || !statusData.status) {
				throw new HttpException(VALIDATION_ERRORS.REQUIRED_USER_ID_AND_STATUS, HttpStatus.BAD_REQUEST);
			}

			const validStatuses = Object.values(UserStatus);
			if (!validStatuses.includes(statusData.status)) {
				throw new HttpException(VALIDATION_ERRORS.INVALID_STATUS, HttpStatus.BAD_REQUEST);
			}

			// await this.userService.updateUserStatus(userId, statusData.status);

			// Log API call
			logger.apiUpdate('admin_update_user_status', {
				adminId: adminUser.id,
				targetUserId: userId,
				newStatus: statusData.status,
			});

			return { updated: true };
		} catch (error) {
			logger.userError('Failed to update user status', {
				error: getErrorMessage(error),
				adminId: adminUser.id,
				targetUserId: userId,
				status: statusData.status,
			});
			throw error;
		}
	}
}
