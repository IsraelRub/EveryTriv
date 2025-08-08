import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';
import { TriviaEntity } from '@shared/entities';

/**
 * Repository for trivia entities
 * Handles all DB operations for trivia
 */
@Injectable()
export class TriviaRepository extends BaseRepository<TriviaEntity> {
  constructor(
    @InjectRepository(TriviaEntity)
    private readonly triviaRepository: Repository<TriviaEntity>
  ) {
    super(triviaRepository);
  }
  
  /**
   * Find trivia questions by topic
   */
  async findByTopic(topic: string): Promise<TriviaEntity[]> {
    return this.triviaRepository.find({
      where: { topic },
      order: { createdAt: 'DESC' }
    });
  }
  
  /**
   * Find trivia questions by difficulty level
   */
  async findByDifficulty(difficulty: string): Promise<TriviaEntity[]> {
    return this.triviaRepository.find({
      where: { difficulty },
      order: { createdAt: 'DESC' }
    });
  }
}
