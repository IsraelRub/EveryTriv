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

import {
	CACHE_DURATION,
	PAGINATION_LIMITS,
	STRING_LIMITS,
	UserRole,
	UserStatus,
	VALIDATION_ERRORS,
} from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type { AdminUserData, BasicUser, TokenPayload } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import {
	Cache,
	CurrentUser,
	CurrentUserId,
	NoCache,
	RequireEmailVerified,
	RequireUserStatus,
	Roles,
} from '../../common';
import { UserDataPipe } from '../../common/pipes';
import {
	ChangePasswordDto,
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
	 * @param user Current user token payload
	 * @returns User profile data
	 */
	@Get('profile')
	@NoCache()
	async getUserProfile(@CurrentUser() user: TokenPayload) {
		try {
			const result = await this.userService.getUserProfile(user.sub);

			// Log API call
			logger.apiRead('user_profile', {
				userId: user.sub,
			});

			return result;
		} catch (error) {
			logger.userError('Error getting user profile', {
				error: getErrorMessage(error),
				userId: user.sub,
			});
			throw error;
		}
	}

	/**
	 * Deduct user credits
	 * @param userId Current user identifier
	 * @param body Credit deduction data
	 * @returns Credit deduction result
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
	 * @param userId Current user identifier
	 * @param profileData Profile update data
	 * @returns Updated user profile
	 */
	@Put('profile')
	@UsePipes(UserDataPipe)
	@RequireEmailVerified()
	@RequireUserStatus('active')
	async updateUserProfile(@CurrentUserId() userId: string, @Body() profileData: UpdateUserProfileDto) {
		try {
			const result = await this.userService.updateUserProfile(userId, profileData);

			// Log API call for profile update
			logger.apiUpdate('user_profile', {
				userId,
				fields: Object.keys(profileData),
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
	 * @param query Search query parameters
	 * @returns Search results with matching users
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
	 * Delete user account
	 * @param userId Current user identifier
	 * @returns Account deletion result
	 */
	@Delete('account')
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
	 * Change user password
	 * @param userId Current user identifier
	 * @param passwordData Password change data
	 * @returns Password change result
	 */
	@Put('change-password')
	async changePassword(@CurrentUserId() userId: string, @Body() passwordData: ChangePasswordDto) {
		try {
			if (!passwordData.currentPassword || !passwordData.newPassword) {
				throw new HttpException('Current password and new password are required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.changePassword(
				userId,
				passwordData.currentPassword,
				passwordData.newPassword
			);

			// Log API call for password change
			logger.apiUpdate('user_password_change', {
				userId,
			});

			return result;
		} catch (error) {
			logger.userError('Error changing password', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Update user preferences
	 * @param userId Current user identifier
	 * @param preferences User preferences data
	 * @returns Updated user preferences
	 */
	@Put('preferences')
	async updateUserPreferences(@CurrentUserId() userId: string, @Body() preferences: UpdateUserPreferencesDto) {
		try {
			const result = await this.userService.updateUserPreferences(userId, preferences);

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
	 * @param userId Current user identifier
	 * @param field Field name to update
	 * @param body Field update data
	 * @returns Updated user field value
	 */
	@Patch('profile/:field')
	async updateUserField(
		@CurrentUserId() userId: string,
		@Param('field') field: string,
		@Body() body: UpdateUserFieldDto
	) {
		try {
			if (!field || !body.value) {
				throw new HttpException(VALIDATION_ERRORS.REQUIRED_FIELD_AND_VALUE, HttpStatus.BAD_REQUEST);
			}

			// Validate field name before type cast
			const validFields: string[] = [
				'email',
				'firstName',
				'lastName',
				'avatar',
				'isActive',
				'credits',
				'purchasedCredits',
				'dailyFreeQuestions',
				'remainingFreeQuestions',
				'role',
				'currentSubscriptionId',
				'status',
			];

			if (!validFields.includes(field)) {
				throw new HttpException(`Invalid field: ${field}`, HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.updateUserField(userId, field, body.value);

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
	 * @param userId Current user identifier
	 * @param preference Preference name to update
	 * @param body Preference update data
	 * @returns Updated preference value
	 */
	@Patch('preferences/:preference')
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
	 * @param id User identifier
	 * @returns User data
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
	 * @param userId User identifier to update
	 * @param creditsData Credit update data
	 * @returns Credit update result
	 */
	@Put('credits/:userId')
	@Roles(UserRole.ADMIN)
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
	 * @param userId User identifier to delete
	 * @returns User deletion result
	 */
	@Delete(':userId')
	@Roles(UserRole.ADMIN)
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
	 * @param userId User identifier to update
	 * @param statusData Status update data
	 * @returns Updated user status
	 */
	@Patch(':userId/status')
	@Roles(UserRole.ADMIN)
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
	 * @param user Current admin user token payload
	 * @param limit Optional pagination limit
	 * @param offset Optional pagination offset
	 * @returns List of users with pagination metadata
	 */
	@Get('admin/all')
	@Roles(UserRole.ADMIN)
	@Cache(CACHE_DURATION.MEDIUM) // Cache for 5 minutes
	async getAllUsers(
		@CurrentUser() user: TokenPayload,
		@Query('limit') limit?: number,
		@Query('offset') offset?: number
	) {
		try {
			const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;
			const parsedOffset = typeof offset === 'string' ? parseInt(offset, 10) : offset;
			const result = await this.userService.getAllUsers(parsedLimit, parsedOffset);

			logger.apiRead('admin_get_all_users', {
				id: user.sub,
				role: user.role,
				usersCount: result.users.length,
				totalUsers: result.total,
			});

			const adminInfo: AdminUserData = {
				id: user.sub,
				email: user.email,
				role: user.role,
				createdAt: new Date().toISOString(),
				lastLogin: undefined,
			};

			return {
				message: 'Users retrieved successfully',
				success: true,
				adminUser: adminInfo,
				users: result.users,
				pagination: {
					total: result.total,
					limit: result.limit,
					offset: result.offset,
				},
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.userError('Failed to get all users', {
				error: getErrorMessage(error),
				id: user.sub,
				role: user.role,
			});
			throw error;
		}
	}

	/**
	 * Admin endpoint - update user status (admin only)
	 * @param adminUser Current admin user data
	 * @param userId User identifier to update
	 * @param statusData Status update data
	 * @returns Updated user status information
	 */
	@Put('admin/:userId/status')
	@Roles(UserRole.ADMIN)
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

			const updated = await this.userService.updateUserStatus(userId, statusData.status);

			logger.apiUpdate('admin_update_user_status', {
				id: adminUser.id,
				targetUserId: userId,
				newStatus: statusData.status,
			});

			return {
				userId: updated.id,
				status: statusData.status,
				isActive: updated.isActive,
				updatedAt: updated.updatedAt ? updated.updatedAt.toISOString() : new Date().toISOString(),
			};
		} catch (error) {
			logger.userError('Failed to update user status', {
				error: getErrorMessage(error),
				id: adminUser.id,
				targetUserId: userId,
				status: statusData.status,
			});
			throw error;
		}
	}
}
