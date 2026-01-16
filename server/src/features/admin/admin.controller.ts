import { Controller, Delete, Get } from '@nestjs/common';

import { TIME_DURATIONS_SECONDS, UserRole } from '@shared/constants';
import type { TokenPayload } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';

import { Cache, CurrentUser, Roles } from '../../common';
import { AdminService } from './admin.service';

@Controller('/admin')
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Get('statistics')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
	async getGameStatistics(@CurrentUser() user: TokenPayload) {
		try {
			const statistics = await this.adminService.getAdminStatistics();

			logger.apiRead('admin_game_statistics', {
				id: user.sub,
				role: user.role,
				totalGames: statistics.totalGames,
			});

			return statistics;
		} catch (error) {
			logger.gameError('Failed to get game statistics', {
				errorInfo: { message: getErrorMessage(error) },
				id: user.sub,
				role: user.role,
			});
			throw error;
		}
	}

	@Delete('history/clear-all')
	@Roles(UserRole.ADMIN)
	async clearAllGameHistory(@CurrentUser() user: TokenPayload) {
		try {
			const result = await this.adminService.clearAllGameHistory();

			logger.apiDelete('admin_clear_all_history', {
				id: user.sub,
				role: user.role,
				deletedCount: result.deletedCount,
			});

			return {
				cleared: (result.deletedCount ?? 0) > 0,
				deletedCount: result.deletedCount ?? 0,
				message: result.message,
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

	@Get('trivia')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.HOUR)
	async getAllTriviaQuestions(@CurrentUser() user: TokenPayload) {
		try {
			const result = await this.adminService.getAllTriviaQuestions();

			logger.apiRead('admin_get_all_trivia', {
				id: user.sub,
				role: user.role,
			});

			return result;
		} catch (error) {
			logger.gameError('Failed to get all trivia questions', {
				errorInfo: { message: getErrorMessage(error) },
				id: user.sub,
				role: user.role,
			});
			throw error;
		}
	}

	@Delete('trivia/clear-all')
	@Roles(UserRole.ADMIN)
	async clearAllTrivia(@CurrentUser() user: TokenPayload) {
		try {
			const result = await this.adminService.clearAllTrivia();

			logger.apiDelete('admin_clear_all_trivia', {
				id: user.sub,
				role: user.role,
				deletedCount: result.deletedCount,
			});

			return {
				cleared: (result.deletedCount ?? 0) > 0,
				deletedCount: result.deletedCount ?? 0,
				message: result.message,
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

	@Delete('stats/clear-all')
	@Roles(UserRole.ADMIN)
	async clearAllUserStats(@CurrentUser() user: TokenPayload) {
		try {
			const result = await this.adminService.clearAllUserStats();

			logger.apiDelete('admin_clear_all_user_stats', {
				id: user.sub,
				role: user.role,
				deletedCount: result.deletedCount,
			});

			return result;
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
