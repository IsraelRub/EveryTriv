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
import { AdminUserData, serverLogger,UserFieldUpdate, UserProfileResponse, UsersListResponse, getErrorMessage } from '@shared';

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
	@Cache(300)
	async getUserProfile(
		@CurrentUser() user: { id: string; username: string; email: string; role: string }
	): Promise<UserProfileResponse> {
		try {
			const result = await this.userService.getUserProfile(user.id);
			return {
				data: {
					id: result.id,
					username: result.username,
					email: result.email,
					role: user.role,
					firstName: result.firstName,
					lastName: result.last_name,
					createdAt: result.created_at?.toISOString(),
					preferences: result.preferences as Record<string, unknown>,
				},
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			serverLogger.userError('Error getting user profile', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Get user credits
	 */
	@Get('credits')
	@Cache(60)
	async getUserCredits(@CurrentUserId() userId: string) {
		try {
			const credits = await this.userService.getUserCredits(userId);
			return {
				success: true,
				data: { credits },
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			serverLogger.userError('Error getting user credits', {
				error: getErrorMessage(error),
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
			return {
				success: true,
				data: result,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			serverLogger.userError('Error deducting credits', {
				error: getErrorMessage(error),
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
	@PerformanceThreshold(1000)
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
			serverLogger.apiUpdate('user_profile', {
				userId: userId,
				fields: Object.keys(profileData),
				ip,
				userAgent,
			});

			return result;
		} catch (error) {
			serverLogger.userError('Error updating user profile', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Search users
	 */
	@Get('search')
	async searchUsers(@Query() query: SearchUsersDto) {
		try {

			const result = await this.userService.searchUsers(query.query, query.limit || 10);

			// Log API call for user search
			serverLogger.apiRead('user_search', {
				query: query.query,
				limit: query.limit || 10,
				resultsCount: result.totalResults,
			});

			return result;
		} catch (error) {
			serverLogger.userError('Error searching users', {
				error: getErrorMessage(error),
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
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Delete user account
	 */
	@Delete('account')
	async deleteUserAccount(@CurrentUserId() userId: string) {
		try {
			const result = await this.userService.deleteUserAccount(userId);

			// Log API call for account deletion
			serverLogger.apiDelete('user_account', {
				userId: userId,
			});

			return result;
		} catch (error) {
			serverLogger.userError('Error deleting user account', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Update user preferences
	 */
	@Put('preferences')
	async updateUserPreferences(@CurrentUserId() userId: string, @Body() preferences: UpdateUserPreferencesDto) {
		try {
			const result = await this.userService.updateUserPreferences(userId, preferences as Record<string, unknown>);

			// Log API call for preferences update
			serverLogger.apiUpdate('user_preferences', {
				userId: userId,
				fields: Object.keys(preferences),
			});

			return result;
		} catch (error) {
			serverLogger.userError('Error updating user preferences', {
				error: getErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Update specific user field
	 */
	@Patch('profile/:field')
	async updateUserField(
		@CurrentUserId() userId: string,
		@Param('field') field: string,
		@Body() body: UpdateUserFieldDto
	) {
		try {
			if (!field || !body.value) {
				throw new HttpException('Field and value are required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.updateUserField(userId, field as keyof UserFieldUpdate, body.value);

			// Log API call for field update
			serverLogger.apiUpdate('user_field', {
				userId: userId,
				field,
			});

			return result;
		} catch (error) {
			serverLogger.userError('Error updating user field', {
				error: getErrorMessage(error),
				field,
			});
			throw error;
		}
	}

	/**
	 * Update single preference
	 */
	@Patch('preferences/:preference')
	async updateSinglePreference(
		@CurrentUserId() userId: string,
		@Param('preference') preference: string,
		@Body() body: UpdateSinglePreferenceDto
	) {
		try {
			if (!preference || body.value === undefined) {
				throw new HttpException('Preference and value are required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.updateSinglePreference(userId, preference, body.value);

			// Log API call for single preference update
			serverLogger.apiUpdate('user_single_preference', {
				userId: userId,
				preference,
			});

			return result;
		} catch (error) {
			serverLogger.userError('Error updating single preference', {
				error: getErrorMessage(error),
				preference,
			});
			throw error;
		}
	}

	/**
	 * Get user by ID (for admins)
	 */
	@Get(':id')
	async getUserById(@Param('id') id: string) {
		try {
			if (!id) {
				throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.getUserById(id);

			// Log API call for user by ID
			serverLogger.apiRead('user_by_id', {
				userId: id,
			});

			return result;
		} catch (error) {
			serverLogger.userError('Error getting user by ID', {
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
	async updateUserCredits(@Param('userId') userId: string, @Body() creditsData: UpdateUserCreditsDto) {
		try {
			if (!userId || !creditsData.amount || !creditsData.reason) {
				throw new HttpException('User ID, amount, and reason are required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.updateUserCredits(userId, creditsData.amount, creditsData.reason);

			// Log API call for credits update
			serverLogger.apiUpdate('user_credits', {
				userId,
				amount: creditsData.amount,
				reason: creditsData.reason,
			});

			return result;
		} catch (error) {
			serverLogger.userError('Error updating user credits', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Delete user (for admins)
	 */
	@Delete(':userId')
	async deleteUser(@Param('userId') userId: string) {
		try {
			if (!userId) {
				throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.deleteUserAccount(userId);

			// Log API call for user deletion
			serverLogger.apiDelete('user_admin_delete', {
				userId,
			});

			return result;
		} catch (error) {
			serverLogger.userError('Error deleting user', {
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
	async updateUserStatus(@Param('userId') userId: string, @Body() statusData: UpdateUserStatusDto) {
		try {
			if (!userId || !statusData.status) {
				throw new HttpException('User ID and status are required', HttpStatus.BAD_REQUEST);
			}

			const validStatuses = ['active', 'suspended', 'banned'];
			if (!validStatuses.includes(statusData.status)) {
				throw new HttpException('Invalid status. Must be: active, suspended, or banned', HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.updateUserStatus(userId, statusData.status);

			// Log API call for status update
			serverLogger.apiUpdate('user_status', {
				userId,
				status: statusData.status,
			});

			return result;
		} catch (error) {
			serverLogger.userError('Error updating user status', {
				error: getErrorMessage(error),
				userId,
			});
			throw error;
		}
	}

	/**
	 * Admin endpoint - get all users (admin only)
	 */
	@Get('admin/all')
	@Roles('admin', 'super-admin')
	async getAllUsers(@CurrentUser() user: { id: string; role: string; username: string; email: string }): Promise<UsersListResponse> {
		try {
			serverLogger.apiRead('admin_get_all_users', {
				adminId: user.id,
				adminRole: user.role,
			});

			// This would call a service method to get all users
			const users: AdminUserData[] = [];

			return {
				message: 'Admin access granted',
				adminUser: {
					id: user.id,
					username: user.username,
					email: user.email,
					role: user.role,
					createdAt: new Date().toISOString(),
				},
				users: users,
				success: true,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			serverLogger.userError('Failed to get all users', {
				error: getErrorMessage(error),
				adminId: user.id,
			});
			throw error;
		}
	}

	/**
	 * Admin endpoint - update user status (admin only)
	 */
	@Put('admin/:userId/status')
	@Roles('admin', 'super-admin')
	async adminUpdateUserStatus(
		@CurrentUser() adminUser: { id: string; role: string; username: string },
		@Param('userId') userId: string,
		@Body() statusData: UpdateUserStatusDto
	): Promise<{ message: string; success: boolean; timestamp: string }> {
		try {
			serverLogger.apiUpdate('admin_update_user_status', {
				adminId: adminUser.id,
				targetUserId: userId,
				newStatus: statusData.status,
			});

			// await this.userService.updateUserStatus(userId, statusData.status);

			return {
				message: 'User status updated successfully',
				success: true,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			serverLogger.userError('Failed to update user status', {
				error: getErrorMessage(error),
				adminId: adminUser.id,
				targetUserId: userId,
			});
			throw error;
		}
	}
}
