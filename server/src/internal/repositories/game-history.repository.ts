import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameHistoryCreationData, serverLogger as logger } from '@shared';
import { Repository } from 'typeorm';

import { RepositoryAudit, RepositoryCache, RepositoryRoles } from '../../common';
import { GameHistoryEntity } from '../entities';
import { BaseRepository } from './base.repository';

@Injectable()
export class GameHistoryRepository extends BaseRepository<GameHistoryEntity> {
	constructor(
		@InjectRepository(GameHistoryEntity)
		private readonly gameHistoryRepository: Repository<GameHistoryEntity>
	) {
		super(gameHistoryRepository);
	}

	@RepositoryCache(600, 'game_history_by_user')
	@RepositoryAudit('game_history_lookup_by_user')
	async findByUserId(userId: string): Promise<GameHistoryEntity[]> {
		try {
			logger.databaseDebug(`Finding game history by user ID: ${userId}`, { context: 'REPOSITORY' });

			const gameHistory = await this.gameHistoryRepository.find({
				where: { userId },
				order: { createdAt: 'DESC' },
			});

			logger.databaseInfo(`Found ${gameHistory.length} game history records for user: ${userId}`, {
				context: 'REPOSITORY',
				count: gameHistory.length,
			});

			return gameHistory;
		} catch (error) {
			logger.databaseError(`Failed to find game history by user ID: ${userId}`, {
				context: 'REPOSITORY',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	@RepositoryCache(1800, 'game_history_by_topic')
	@RepositoryAudit('game_history_lookup_by_topic')
	async findByTopic(topic: string): Promise<GameHistoryEntity[]> {
		try {
			logger.databaseDebug(`Finding game history by topic: ${topic}`, { context: 'REPOSITORY' });

			const gameHistory = await this.gameHistoryRepository.find({
				where: { topic },
				order: { createdAt: 'DESC' },
			});

			logger.databaseInfo(`Found ${gameHistory.length} game history records for topic: ${topic}`, {
				context: 'REPOSITORY',
				count: gameHistory.length,
			});

			return gameHistory;
		} catch (error) {
			logger.databaseError(`Failed to find game history by topic: ${topic}`, {
				context: 'REPOSITORY',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	@RepositoryCache(3600, 'game_history_stats')
	@RepositoryRoles('admin', 'super-admin')
	@RepositoryAudit('game_history_stats_lookup')
	async getGameStats(): Promise<{ totalGames: number; averageScore: number; topScore: number }> {
		try {
			logger.databaseDebug('Getting game statistics', { context: 'REPOSITORY' });

			const totalGames = await this.gameHistoryRepository.count();
			const result = await this.gameHistoryRepository
				.createQueryBuilder('gameHistory')
				.select('AVG(gameHistory.score)', 'averageScore')
				.addSelect('MAX(gameHistory.score)', 'topScore')
				.getRawOne();

			const stats = {
				totalGames,
				averageScore: parseFloat(result.averageScore) || 0,
				topScore: parseInt(result.topScore) || 0,
			};

			logger.databaseInfo('Game statistics retrieved', {
				context: 'REPOSITORY',
				stats,
			});

			return stats;
		} catch (error) {
			logger.databaseError('Failed to get game statistics', {
				context: 'REPOSITORY',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	@RepositoryAudit('game_history_creation')
	async createGameHistory(gameData: GameHistoryCreationData): Promise<GameHistoryEntity> {
		try {
			logger.databaseDebug('Creating game history record', { context: 'REPOSITORY' });

			const gameHistory = await this.create(gameData);

			logger.databaseInfo('Game history record created', {
				context: 'REPOSITORY',
				gameHistoryId: gameHistory.id,
			});

			return gameHistory;
		} catch (error) {
			logger.databaseError('Failed to create game history record', {
				context: 'REPOSITORY',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
