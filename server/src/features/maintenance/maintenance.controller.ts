import { Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { UserRole } from '@shared/constants';
import type { TokenPayload } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';

import { CurrentUser, Roles } from '../../common';
import { DataMaintenanceService } from './data-maintenance.service';
import { UserStatsMaintenanceService } from './user-stats-maintenance.service';

@Controller('/admin/maintenance')
export class MaintenanceController {
	constructor(
		private readonly userStatsMaintenanceService: UserStatsMaintenanceService,
		private readonly dataMaintenanceService: DataMaintenanceService
	) {}

	// ==================== User Stats Consistency Endpoints ====================

	@Get('stats/consistency-check/all')
	@Roles(UserRole.ADMIN)
	async checkAllUsersConsistency(@CurrentUser() user: TokenPayload) {
		try {
			const result = await this.userStatsMaintenanceService.checkAllUsersConsistency();

			logger.apiRead('maintenance_all_users_consistency_check', {
				id: user.sub,
				role: user.role,
				totalUsers: result.totalUsers,
				usersWithGames: result.usersWithGames,
				consistentUsers: result.consistentUsers,
				inconsistentUsers: result.inconsistentUsers,
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error checking all users consistency', {
				errorInfo: { message: getErrorMessage(error) },
				id: user.sub,
				role: user.role,
			});
			throw error;
		}
	}

	@Get('stats/consistency/:userId')
	@Roles(UserRole.ADMIN)
	async checkUserStatsConsistency(@Param('userId') userId: string, @CurrentUser() user: TokenPayload) {
		try {
			const result = await this.userStatsMaintenanceService.checkConsistency(userId);

			logger.apiRead('maintenance_user_stats_consistency_check', {
				id: user.sub,
				role: user.role,
				userId,
				isConsistent: result.isConsistent,
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error checking user stats consistency', {
				errorInfo: { message: getErrorMessage(error) },
				id: user.sub,
				role: user.role,
				userId,
			});
			throw error;
		}
	}

	@Post('stats/fix-consistency/:userId')
	@Roles(UserRole.ADMIN)
	async fixUserStatsConsistency(@Param('userId') userId: string, @CurrentUser() user: TokenPayload) {
		try {
			const result = await this.userStatsMaintenanceService.fixConsistency(userId);

			logger.apiUpdate('maintenance_user_stats_consistency_fix', {
				id: user.sub,
				role: user.role,
				userId,
				fixed: result.fixed,
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error fixing user stats consistency', {
				errorInfo: { message: getErrorMessage(error) },
				id: user.sub,
				role: user.role,
				userId,
			});
			throw error;
		}
	}

	@Post('stats/fix-consistency-all')
	@Roles(UserRole.ADMIN)
	async fixAllUsersStatsConsistency(@CurrentUser() user: TokenPayload) {
		try {
			const result = await this.userStatsMaintenanceService.fixAllInconsistentUsers();

			logger.apiUpdate('maintenance_fix_all_users_consistency', {
				id: user.sub,
				role: user.role,
				fixedCount: result.fixedCount,
				totalInconsistent: result.totalInconsistent,
			});

			return result;
		} catch (error) {
			logger.analyticsError('Error fixing all users stats consistency', {
				errorInfo: { message: getErrorMessage(error) },
				id: user.sub,
				role: user.role,
			});
			throw error;
		}
	}

	// ==================== Data Cleanup Endpoints ====================

	@Delete('data/game-history/clear-all')
	@Roles(UserRole.ADMIN)
	async clearAllGameHistory(@CurrentUser() user: TokenPayload) {
		try {
			const result = await this.dataMaintenanceService.clearAllGameHistory();

			logger.apiDelete('maintenance_clear_all_game_history', {
				id: user.sub,
				role: user.role,
				deletedCount: result.deletedCount,
			});

			return {
				success: result.success,
				message: result.message,
				deletedCount: result.deletedCount ?? 0,
			};
		} catch (error) {
			logger.gameError('Failed to clear all game history', {
				errorInfo: { message: getErrorMessage(error) },
				id: user.sub,
				role: user.role,
			});
			throw error;
		}
	}

	@Delete('data/trivia/clear-all')
	@Roles(UserRole.ADMIN)
	async clearAllTrivia(@CurrentUser() user: TokenPayload) {
		try {
			const result = await this.dataMaintenanceService.clearAllTrivia();

			logger.apiDelete('maintenance_clear_all_trivia', {
				id: user.sub,
				role: user.role,
				deletedCount: result.deletedCount,
			});

			return {
				success: result.success,
				message: result.message,
				deletedCount: result.deletedCount ?? 0,
			};
		} catch (error) {
			logger.gameError('Failed to clear all trivia', {
				errorInfo: { message: getErrorMessage(error) },
				id: user.sub,
				role: user.role,
			});
			throw error;
		}
	}

	@Delete('data/user-stats/clear-all')
	@Roles(UserRole.ADMIN)
	async clearAllUserStats(@CurrentUser() user: TokenPayload) {
		try {
			const result = await this.dataMaintenanceService.clearAllUserStats();

			logger.apiDelete('maintenance_clear_all_user_stats', {
				id: user.sub,
				role: user.role,
				deletedCount: result.deletedCount,
			});

			return {
				success: result.success,
				message: result.message,
				deletedCount: result.deletedCount ?? 0,
			};
		} catch (error) {
			logger.userError('Failed to clear all user stats', {
				errorInfo: { message: getErrorMessage(error) },
				id: user.sub,
				role: user.role,
			});
			throw error;
		}
	}
}
