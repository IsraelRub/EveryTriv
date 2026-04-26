import { Body, Controller, Get, Put, Query } from '@nestjs/common';

import { API_ENDPOINTS, TIME_DURATIONS_SECONDS, UserRole } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { Cache, CurrentUser, Roles } from '@common/decorators';
import { serverLogger as logger } from '@internal/services';
import type { CreditPackageConfigItem, TokenPayload } from '@internal/types';

import { CreditsService, UpdateCreditPackagesDto } from '../credits';
import { AdminService } from './admin.service';
import { AdminTriviaListQueryDto } from './dtos';

@Controller(API_ENDPOINTS.ADMIN.BASE)
export class AdminController {
	constructor(
		private readonly adminService: AdminService,
		private readonly creditsService: CreditsService
	) {}

	@Get('statistics')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.FIFTEEN_MINUTES)
	async getGameStatistics(@CurrentUser() user: TokenPayload) {
		try {
			const statistics = await this.adminService.getAdminStatistics();

			logger.apiRead('admin_game_statistics', {
				userId: user.sub,
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
				userId: user.sub,
				role: user.role,
			});
			throw error;
		}
	}

	@Get('trivia')
	@Roles(UserRole.ADMIN)
	@Cache(TIME_DURATIONS_SECONDS.HOUR)
	async getAllTriviaQuestions(@CurrentUser() user: TokenPayload, @Query() query: AdminTriviaListQueryDto) {
		try {
			const result = await this.adminService.getAllTriviaQuestions({ limit: query.limit, offset: query.offset });

			const questions = result?.questions ?? [];
			const topicCounts: Record<string, number> = {};
			for (const q of questions) {
				const t = q.topic ?? 'unknown';
				topicCounts[t] = (topicCounts[t] ?? 0) + 1;
			}
			logger.apiRead('admin_get_all_trivia', {
				userId: user.sub,
				role: user.role,
				chart: 'admin_trivia',
				count: questions.length,
				totalCount: result.totalCount,
				topicsPlayed: topicCounts,
			});

			return result;
		} catch (error) {
			logger.gameError('Failed to get all trivia questions', {
				errorInfo: { message: getErrorMessage(error) },
				userId: user.sub,
				role: user.role,
			});
			throw error;
		}
	}

	@Get('pricing')
	@Roles(UserRole.ADMIN)
	async getPricing(@CurrentUser() user: TokenPayload) {
		try {
			const result = await this.creditsService.getCreditPackagesForAdmin();
			logger.apiRead('admin_pricing_get', { userId: user.sub, role: user.role });
			return result;
		} catch (error) {
			logger.userError('Failed to get admin pricing', {
				errorInfo: { message: getErrorMessage(error) },
				userId: user.sub,
			});
			throw error;
		}
	}

	@Put('pricing')
	@Roles(UserRole.ADMIN)
	async updatePricing(@CurrentUser() user: TokenPayload, @Body() body: UpdateCreditPackagesDto) {
		try {
			const items: CreditPackageConfigItem[] = body.packages.map(p => ({
				id: p.id,
				credits: p.credits,
				price: p.price,
				priceIls: p.priceIls,
				tier: p.tier,
			}));
			await this.creditsService.setCreditPackages(items);
			logger.apiUpdate('admin_pricing_put', { userId: user.sub, role: user.role, count: items.length });
			return { success: true };
		} catch (error) {
			logger.userError('Failed to update admin pricing', {
				errorInfo: { message: getErrorMessage(error) },
				userId: user.sub,
			});
			throw error;
		}
	}
}
