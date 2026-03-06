import { Controller, Get } from '@nestjs/common';

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
				chart: 'admin_game_statistics',
				averageScore: statistics.averageScore,
				bestScore: statistics.bestScore,
				accuracy: statistics.accuracy,
				activePlayers24h: statistics.activePlayers24h,
				topics: statistics.topics,
				difficultyDistribution: statistics.difficultyDistribution,
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

	@Get('trivia')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.HOUR)
	async getAllTriviaQuestions(@CurrentUser() user: TokenPayload) {
		try {
			const result = await this.adminService.getAllTriviaQuestions();

			const questions = result?.questions ?? [];
			const topicCounts: Record<string, number> = {};
			for (const q of questions) {
				const t = q.topic ?? 'unknown';
				topicCounts[t] = (topicCounts[t] ?? 0) + 1;
			}
			logger.apiRead('admin_get_all_trivia', {
				id: user.sub,
				role: user.role,
				chart: 'admin_trivia',
				count: questions.length,
				topicsPlayed: topicCounts,
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
}
