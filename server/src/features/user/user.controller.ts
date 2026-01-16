import {
	Body,
	Controller,
	Delete,
	ForbiddenException,
	Get,
	HttpException,
	HttpStatus,
	Param,
	Patch,
	Post,
	Put,
	Query,
} from '@nestjs/common';

import {
	API_ENDPOINTS,
	ERROR_CODES,
	GameMode,
	TIME_DURATIONS_SECONDS,
	UserRole,
	UserStatus,
	VALID_USER_STATUSES_SET,
	VALIDATION_LENGTH,
} from '@shared/constants';
import type { AdminUserData, TokenPayload } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';

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
import { AuthService } from '../auth/auth.service';
import { CreditsService } from '../credits/credits.service';
import { DeductCreditsDto } from '../credits/dtos';
import {
	ChangePasswordDto,
	SearchUsersDto,
	SetAvatarDto,
	UpdateSinglePreferenceDto,
	UpdateUserCreditsDto,
	UpdateUserFieldDto,
	UpdateUserPreferencesDto,
	UpdateUserProfileDto,
	UpdateUserStatusDto,
} from './dtos';
import { UserService } from './user.service';

@Controller(API_ENDPOINTS.USER.BASE)
export class UserController {
	constructor(
		private readonly userService: UserService,
		private readonly creditsService: CreditsService,
		private readonly authService: AuthService
	) {}

	@Get('profile')
	@NoCache()
	async getUserProfile(@CurrentUser() user: TokenPayload | null) {
		if (!user?.sub) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			const result = await this.userService.getUserProfile(user.sub);

			logger.apiRead('user_profile', {
				userId: user.sub,
			});

			return result;
		} catch (error) {
			logger.userError('Error getting user profile', {
				errorInfo: { message: getErrorMessage(error) },
				userId: user.sub,
			});
			throw error;
		}
	}

	@Post('credits')
	async deductCredits(@CurrentUserId() userId: string | null, @Body() body: DeductCreditsDto) {
		if (!userId) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			const result = await this.creditsService.deductCredits(
				userId,
				body.questionsPerRequest,
				body.gameMode ?? GameMode.QUESTION_LIMITED,
				body.reason ?? 'Game play'
			);

			logger.apiUpdate('user_credits_deduct', {
				userId,
				questionsPerRequest: body.questionsPerRequest,
				gameMode: body.gameMode ?? GameMode.QUESTION_LIMITED,
				reason: body.reason ?? 'Game play',
			});

			return result;
		} catch (error) {
			logger.userError('Error deducting credits', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				questionsPerRequest: body.questionsPerRequest,
			});
			throw error;
		}
	}

	@Put('profile')
	@RequireEmailVerified()
	@RequireUserStatus(UserStatus.ACTIVE)
	async updateUserProfile(
		@CurrentUserId() userId: string | null,
		@Body(UserDataPipe) profileData: UpdateUserProfileDto
	) {
		if (!userId) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			const result = await this.userService.updateUserProfile(userId, profileData);

			logger.apiUpdate('user_profile', {
				userId,
				fields: Object.keys(profileData),
			});

			return result;
		} catch (error) {
			logger.userError('Error updating user profile', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				fields: Object.keys(profileData),
			});
			throw error;
		}
	}

	@Patch('avatar')
	@RequireEmailVerified()
	@RequireUserStatus(UserStatus.ACTIVE)
	async setAvatar(@CurrentUserId() userId: string | null, @Body() avatarData: SetAvatarDto) {
		if (!userId) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			const result = await this.userService.setAvatar(userId, avatarData.avatarId);

			logger.apiUpdate('user_avatar', {
				userId,
				avatar: avatarData.avatarId,
			});

			return result;
		} catch (error) {
			logger.userError('Error setting user avatar', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				avatar: avatarData.avatarId,
			});
			throw error;
		}
	}

	@Get('search')
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
	async searchUsers(@Query() query: SearchUsersDto) {
		try {
			const result = await this.userService.searchUsers(query.query, query.limit);

			logger.apiRead('user_search', {
				query: query.query,
				limit: query.limit,
				resultsCount: result.totalResults,
			});

			return result;
		} catch (error) {
			logger.userError('Error searching users', {
				errorInfo: { message: getErrorMessage(error) },
				query: query.query,
				limit: query.limit,
			});
			throw error;
		}
	}

	@Delete('account')
	async deleteUserAccount(@CurrentUserId() userId: string | null) {
		if (!userId) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			const result = await this.userService.deleteUserAccount(userId);

			logger.apiDelete('user_account', {
				userId,
			});

			return result;
		} catch (error) {
			logger.userError('Error deleting user account', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	@Put('change-password')
	async changePassword(@CurrentUserId() userId: string | null, @Body() passwordData: ChangePasswordDto) {
		if (!userId) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			if (!passwordData.currentPassword || !passwordData.newPassword) {
				throw new HttpException(ERROR_CODES.CURRENT_PASSWORD_AND_NEW_PASSWORD_REQUIRED, HttpStatus.BAD_REQUEST);
			}

			const result = await this.authService.changePassword(userId, passwordData);

			logger.apiUpdate('user_password_change', {
				userId,
			});

			return result;
		} catch (error) {
			logger.userError('Error changing password', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
			});
			throw error;
		}
	}

	@Put('preferences')
	async updateUserPreferences(@CurrentUserId() userId: string | null, @Body() preferences: UpdateUserPreferencesDto) {
		if (!userId) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			const result = await this.userService.updateUserPreferences(userId, preferences);

			logger.apiUpdate('user_preferences', {
				userId,
				fields: Object.keys(preferences),
			});

			return result;
		} catch (error) {
			logger.userError('Error updating user preferences', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				fields: Object.keys(preferences),
			});
			throw error;
		}
	}

	@Patch('profile/:field')
	async updateUserField(
		@CurrentUserId() userId: string | null,
		@Param('field') field: string,
		@Body() body: UpdateUserFieldDto
	) {
		if (!userId) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			if (!field || !body.value) {
				throw new HttpException(ERROR_CODES.REQUIRED_FIELD_AND_VALUE, HttpStatus.BAD_REQUEST);
			}

			const validFieldsSet = new Set<string>([
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
				'status',
			]);

			if (!validFieldsSet.has(field)) {
				throw new HttpException(`Invalid field: ${field}`, HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.updateUserField(userId, field, body.value);

			logger.apiUpdate('user_field', {
				userId,
				fields: [field],
				value:
					typeof body.value === 'string'
						? body.value.substring(0, VALIDATION_LENGTH.STRING_TRUNCATION.SHORT)
						: body.value,
			});

			return result;
		} catch (error) {
			logger.userError('Error updating user field', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				fields: [field],
			});
			throw error;
		}
	}

	@Patch('preferences/:preference')
	async updateSinglePreference(
		@CurrentUserId() userId: string | null,
		@Param('preference') preference: string,
		@Body() body: UpdateSinglePreferenceDto
	) {
		if (!userId) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			if (!preference || body.value === undefined) {
				throw new HttpException(ERROR_CODES.REQUIRED_PREFERENCE_AND_VALUE, HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.updateSinglePreference(userId, preference, body.value);

			logger.apiUpdate('user_single_preference', {
				userId,
				preference,
				value: typeof body.value === 'string' ? body.value.substring(0, 50) : body.value,
			});

			return result;
		} catch (error) {
			logger.userError('Error updating single preference', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				preference,
			});
			throw error;
		}
	}

	@Get(':id')
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
	async getUserById(@Param('id') id: string) {
		try {
			if (!id) {
				throw new HttpException(ERROR_CODES.REQUIRED_USER_ID, HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.getUserById(id);

			logger.apiRead('user_by_id', {
				userId: id,
			});

			return result;
		} catch (error) {
			logger.userError('Error getting user by ID', {
				errorInfo: { message: getErrorMessage(error) },
				userId: id,
			});
			throw error;
		}
	}

	@Patch('credits/:userId')
	@Roles(UserRole.ADMIN)
	async updateUserCredits(@Param('userId') userId: string, @Body() creditsData: UpdateUserCreditsDto) {
		try {
			if (!userId || !creditsData.amount || !creditsData.reason) {
				throw new HttpException(ERROR_CODES.REQUIRED_AMOUNT_AND_REASON, HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.updateUserCredits({
				userId,
				amount: creditsData.amount,
				reason: creditsData.reason,
			});

			logger.apiUpdate('user_credits_admin', {
				userId,
				amount: creditsData.amount,
				reason: creditsData.reason,
			});

			return result;
		} catch (error) {
			logger.userError('Error updating user credits', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				amount: creditsData.amount,
			});
			throw error;
		}
	}

	@Delete(':id')
	@Roles(UserRole.ADMIN)
	async deleteUser(@Param('id') id: string) {
		try {
			if (!id) {
				throw new HttpException(ERROR_CODES.REQUIRED_USER_ID, HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.deleteUserAccount(id);

			logger.apiDelete('user_admin_delete', {
				userId: id,
			});

			return result;
		} catch (error) {
			logger.userError('Error deleting user', {
				errorInfo: { message: getErrorMessage(error) },
				userId: id,
			});
			throw error;
		}
	}

	@Patch(':userId/status')
	@Roles(UserRole.ADMIN)
	async updateUserStatus(@Param('userId') userId: string, @Body() statusData: UpdateUserStatusDto) {
		try {
			if (!userId || !statusData.status) {
				throw new HttpException(ERROR_CODES.REQUIRED_USER_ID_AND_STATUS, HttpStatus.BAD_REQUEST);
			}

			if (!VALID_USER_STATUSES_SET.has(statusData.status)) {
				throw new HttpException(ERROR_CODES.INVALID_STATUS, HttpStatus.BAD_REQUEST);
			}

			const result = await this.userService.updateUserStatus(userId, statusData.status);

			logger.apiUpdate('user_status_admin', {
				userId,
				status: statusData.status,
			});

			return result;
		} catch (error) {
			logger.userError('Error updating user status', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				status: statusData.status,
			});
			throw error;
		}
	}

	@Get('admin/all')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
	async getAllUsers(
		@CurrentUser() user: TokenPayload | null,
		@Query('limit') limit?: number,
		@Query('offset') offset?: number
	) {
		if (!user?.sub) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
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
				...user,
				createdAt: new Date().toISOString(),
				lastLogin: undefined,
			};

			const { users, ...paginationData } = result;

			return {
				message: 'Users retrieved successfully',
				success: true,
				adminUser: adminInfo,
				users,
				pagination: paginationData,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.userError('Failed to get all users', {
				errorInfo: { message: getErrorMessage(error) },
				id: user.sub,
				role: user.role,
			});
			throw error;
		}
	}

	@Patch('admin/:userId/status')
	@Roles(UserRole.ADMIN)
	async adminUpdateUserStatus(
		@CurrentUser() adminUser: TokenPayload | null,
		@Param('userId') userId: string,
		@Body() statusData: UpdateUserStatusDto
	) {
		if (!adminUser?.sub) {
			throw new ForbiddenException(ERROR_CODES.USER_NOT_AUTHENTICATED);
		}
		try {
			if (!userId || !statusData.status) {
				throw new HttpException(ERROR_CODES.REQUIRED_USER_ID_AND_STATUS, HttpStatus.BAD_REQUEST);
			}

			if (!VALID_USER_STATUSES_SET.has(statusData.status)) {
				throw new HttpException(ERROR_CODES.INVALID_STATUS, HttpStatus.BAD_REQUEST);
			}

			const updated = await this.userService.updateUserStatus(userId, statusData.status);

			logger.apiUpdate('admin_update_user_status', {
				id: adminUser.sub,
				userIds: {
					target: userId,
				},
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
				errorInfo: { message: getErrorMessage(error) },
				id: adminUser.sub,
				userIds: {
					target: userId,
				},
				status: statusData.status,
			});
			throw error;
		}
	}
}
