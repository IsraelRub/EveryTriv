import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { serverLogger as logger,TriviaAnswer  } from '@shared';
import { TriviaEntity } from 'src/internal/entities';
import { DeepPartial, Repository } from 'typeorm';

import { AiProvidersService } from './providers/management';

/**
 * Service for generating trivia questions using AI
 * Handles question generation, validation, and storage
 */
@Injectable()
export class TriviaGenerationService {
	constructor(
		@InjectRepository(TriviaEntity)
		private readonly triviaRepository: Repository<TriviaEntity>,
		private readonly aiProvidersService: AiProvidersService
	) {}

	/**
	 * Generate trivia question
	 * @param topic Topic for the question
	 * @param difficulty Difficulty level
	 * @param userId User ID for personalization
	 * @returns Generated trivia question
	 */
	async generateQuestion(topic: string, difficulty: string, userId?: string): Promise<TriviaEntity> {
		try {
			logger.gameTarget('Generating trivia question', {
				topic,
				difficulty,
				userId: userId || 'anonymous',
			});

			// Try to generate question using AI
			const question = await this.generateAIQuestion(topic, difficulty);

			if (question) {
				// Save to database
				const triviaEntity = this.convertQuestionToEntity(question, userId);
				const savedQuestion = await this.saveQuestion(triviaEntity);

				logger.gameTarget('Question generated successfully', {
					questionId: savedQuestion.id,
					topic,
					difficulty,
				});

				return savedQuestion;
			}

			// If AI generation fails, throw an error instead of using mock
			throw new Error('Failed to generate question with AI providers');
		} catch (error) {
			logger.gameError('Failed to generate trivia question', {
				error: error instanceof Error ? error.message : 'Unknown error',
				topic,
				difficulty,
				userId: userId || 'anonymous',
			});

			// Re-throw the error instead of falling back to mock
			throw new Error(
				`Failed to generate trivia question: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Generate multiple trivia questions
	 * @param topic Topic for the questions
	 * @param difficulty Difficulty level
	 * @param count Number of questions to generate
	 * @param userId User ID (optional)
	 * @returns Array of generated questions
	 */
	async generateQuestions(topic: string, difficulty: string, count: number, userId?: string) {
		try {
			logger.gameTarget('Generating multiple trivia questions', {
				topic,
				difficulty,
				count,
				userId: userId || 'anonymous',
			});

			const questions = [];
			for (let i = 0; i < count; i++) {
				try {
					const question = await this.generateQuestion(topic, difficulty, userId);
					questions.push(question);
				} catch (error) {
					logger.gameError('Failed to generate question', {
						error: error instanceof Error ? error.message : 'Unknown error',
						attempt: i + 1,
						topic,
						difficulty,
					});
					// Continue with next question
				}
			}

			return questions;
		} catch (error) {
			logger.gameError('Failed to generate multiple trivia questions', {
				error: error instanceof Error ? error.message : 'Unknown error',
				topic,
				difficulty,
				count,
				userId: userId || 'anonymous',
			});
			throw error;
		}
	}

	/**
	 * Get existing question by ID
	 * @param questionId Question ID
	 * @returns Trivia question
	 */
	async getQuestionById(questionId: string) {
		try {
			logger.gameTarget('Getting question by ID', {
				questionId,
			});

			const question = await this.triviaRepository.findOne({ where: { id: questionId } });
			if (!question) {
				throw new Error('Question not found');
			}

			return {
				id: question.id,
				question: question.question,
				answers: question.answers,
				correctAnswerIndex: question.correctAnswerIndex,
				topic: question.topic,
				difficulty: question.difficulty,
				metadata: question.metadata,
				created_at: question.createdAt,
			};
		} catch (error) {
			logger.gameError('Failed to get question by ID', {
				error: error instanceof Error ? error.message : 'Unknown error',
				questionId,
			});
			throw error;
		}
	}

	/**
	 * Get random questions by topic and difficulty
	 * @param topic Topic
	 * @param difficulty Difficulty level
	 * @param count Number of questions
	 * @returns Array of questions
	 */
	async getRandomQuestions(topic: string, difficulty: string, count: number) {
		try {
			logger.gameTarget('Getting random questions', {
				topic,
				difficulty,
				count,
			});

			const questions = await this.triviaRepository
				.createQueryBuilder('trivia')
				.where('trivia.topic = :topic', { topic })
				.andWhere('trivia.difficulty = :difficulty', { difficulty })
				.orderBy('RANDOM()')
				.limit(count)
				.getMany();

			return questions.map(question => ({
				id: question.id,
				question: question.question,
				answers: question.answers,
				correctAnswerIndex: question.correctAnswerIndex,
				topic: question.topic,
				difficulty: question.difficulty,
				metadata: question.metadata,
				created_at: question.createdAt,
			}));
		} catch (error) {
			logger.gameError('Failed to get random questions', {
				error: error instanceof Error ? error.message : 'Unknown error',
				topic,
				difficulty,
				count,
			});
			throw error;
		}
	}

	/**
	 * Generate question using AI providers
	 * @param topic Topic for the question
	 * @param difficulty Difficulty level
	 * @returns AI generated question
	 */
	private async generateAIQuestion(topic: string, difficulty: string) {
		try {
			// Generate question using AI providers service
			const aiQuestion = await this.aiProvidersService.generateQuestion(topic, difficulty, 'he');

			// Convert AI question to our format
			const question = this.convertAIQuestionToFormat(aiQuestion, topic, difficulty);

			logger.gameTarget('AI question generated successfully', {
				topic,
				difficulty,
			});

			return question;
		} catch (error) {
			logger.gameError('Failed to generate AI question', {
				error: error instanceof Error ? error.message : 'Unknown error',
				topic,
				difficulty,
			});
			throw error;
		}
	}

	/**
	 * Convert AI question to our format
	 * @param aiQuestion AI generated question
	 * @param topic Topic
	 * @param difficulty Difficulty
	 * @returns Formatted question
	 */
	private convertAIQuestionToFormat(
		aiQuestion: {
			question: string;
			answers: TriviaAnswer[];
			correctAnswerIndex: number;
			explanation?: string;
			metadata?: Record<string, unknown>;
		},
		topic: string,
		difficulty: string
	) {
		try {
			// AI question already comes in the correct format from the providers
			return {
				question: aiQuestion.question,
				answers: aiQuestion.answers.map(answer => answer.text),
				correctAnswerIndex: aiQuestion.correctAnswerIndex,
				topic,
				difficulty,
				explanation: aiQuestion.explanation || '',
				metadata: {
					...aiQuestion.metadata,
					category: topic,
					difficulty,
					source: 'ai',
					generatedAt: new Date().toISOString(),
				},
			};
		} catch (error) {
			logger.gameError('Failed to convert AI question format', {
				error: error instanceof Error ? error.message : 'Unknown error',
				aiQuestion: JSON.stringify(aiQuestion),
			});
			throw new Error('Invalid AI question format');
		}
	}

	/**
	 * Convert question data to trivia entity
	 * @param questionData Question data
	 * @param userId User ID
	 * @returns Trivia entity
	 */
	private convertQuestionToEntity(
		questionData: {
			question: string;
			answers: string[];
			correctAnswerIndex: number;
			topic: string;
			difficulty: string;
			metadata?: Record<string, unknown>;
		},
		userId?: string
	): DeepPartial<TriviaEntity> {
		return {
			question: questionData.question,
			answers: questionData.answers.map((answer, index) => ({
				text: answer,
				isCorrect: index === questionData.correctAnswerIndex,
			})),
			correctAnswerIndex: questionData.correctAnswerIndex,
			topic: questionData.topic,
			difficulty: questionData.difficulty,
			metadata: questionData.metadata,
			userId: userId || '',
			createdAt: new Date(),
		};
	}

	/**
	 * Save question to database
	 * @param triviaEntity Trivia entity
	 * @returns Saved trivia entity
	 */
	private async saveQuestion(triviaEntity: DeepPartial<TriviaEntity>): Promise<TriviaEntity> {
		try {
			const question = this.triviaRepository.create(triviaEntity);
			const savedQuestion = await this.triviaRepository.save(question);

			logger.gameTarget('Question saved to database', {
				questionId: savedQuestion.id,
				topic: savedQuestion.topic || 'unknown',
			});

			return savedQuestion;
		} catch (error) {
			logger.databaseError('Failed to save question to database', {
				error: error instanceof Error ? error.message : 'Unknown error',
				topic: triviaEntity.topic || 'unknown',
			});
			throw error;
		}
	}
}
