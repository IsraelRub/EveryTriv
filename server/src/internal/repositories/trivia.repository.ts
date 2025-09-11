import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TriviaEntity } from 'src/internal/entities';
import { Repository } from 'typeorm';
import { serverLogger as logger } from '@shared';
import { BaseRepository } from './base.repository';
import { RepositoryCache, RepositoryAudit } from '../../common';

/**
 * Repository for trivia entities
 * Handles all database operations for trivia questions and game data
 */
@Injectable()
export class TriviaRepository extends BaseRepository<TriviaEntity> {
	constructor(
		@InjectRepository(TriviaEntity)
		private readonly triviaRepository: Repository<TriviaEntity>,
		
	) {
		super(triviaRepository);
	}

	/**
	 * Find trivia questions by topic
	 * @param topic The topic to search for
	 * @returns Promise<TriviaEntity[]> Array of trivia questions for the topic
	 * @throws Error - When database query fails
	 */
	@RepositoryCache(1800, 'trivia_by_topic')
	@RepositoryAudit('trivia_lookup_by_topic')
	async findByTopic(topic: string): Promise<TriviaEntity[]> {
		try {
			logger.databaseDebug(`Finding trivia questions by topic: ${topic}`, { context: 'REPOSITORY' });

			const questions = await this.triviaRepository.find({
				where: { topic },
				order: { id: 'ASC' },
			});

			logger.databaseInfo(`Found ${questions.length} trivia questions for topic: ${topic}`, {
				context: 'REPOSITORY',
				count: questions.length,
			});
			return questions;
		} catch (error) {
			logger.databaseError(`Failed to find trivia questions by topic: ${topic}`, {
				context: 'REPOSITORY',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Find trivia questions by difficulty level
	 * @param difficulty The difficulty level to search for
	 * @returns Promise<TriviaEntity[]> Array of trivia questions for the difficulty
	 * @throws Error - When database query fails
	 */
	@RepositoryCache(1800, 'trivia_by_difficulty')
	@RepositoryAudit('trivia_lookup_by_difficulty')
	async findByDifficulty(difficulty: string): Promise<TriviaEntity[]> {
		try {
			logger.databaseDebug(`Finding trivia questions by difficulty: ${difficulty}`, { context: 'REPOSITORY' });

			const questions = await this.triviaRepository.find({
				where: { difficulty },
				order: { id: 'ASC' },
			});

			logger.databaseInfo(`Found ${questions.length} trivia questions for difficulty: ${difficulty}`, {
				context: 'REPOSITORY',
				count: questions.length,
			});
			return questions;
		} catch (error) {
			logger.databaseError(`Failed to find trivia questions by difficulty: ${difficulty}`, {
				context: 'REPOSITORY',
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}
