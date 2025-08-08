import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameHistoryEntity } from '../../../shared/entities/game-history.entity';

@Injectable()
export class GameHistoryService {
  constructor(
    @InjectRepository(GameHistoryEntity)
    private readonly gameHistoryRepository: Repository<GameHistoryEntity>,
  ) {}

  async createGameHistory(gameData: {
    userId: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    difficulty: string;
    topic?: string;
    gameMode: 'time-limited' | 'question-limited' | 'unlimited';
    timeSpent?: number;
    creditsUsed: number;
    questionsData: Array<{
      question: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      timeSpent?: number;
    }>;
  }): Promise<GameHistoryEntity> {
    const gameHistory = this.gameHistoryRepository.create(gameData);
    return await this.gameHistoryRepository.save(gameHistory);
  }

  async getUserGameHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<GameHistoryEntity[]> {
    return await this.gameHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getGlobalLeaderboard(limit: number = 100): Promise<Array<{
    userId: string;
    username: string;
    totalScore: number;
    totalGames: number;
    averageScore: number;
  }>> {
    const result = await this.gameHistoryRepository
      .createQueryBuilder('gh')
      .leftJoin('gh.user', 'u')
      .select('gh.userId', 'userId')
      .addSelect('u.username', 'username')
      .addSelect('SUM(gh.score)', 'totalScore')
      .addSelect('COUNT(gh.id)', 'totalGames')
      .addSelect('AVG(gh.score)', 'averageScore')
      .groupBy('gh.userId, u.username')
      .orderBy('totalScore', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map(row => ({
      userId: row.userId,
      username: row.username,
      totalScore: parseInt(row.totalScore) || 0,
      totalGames: parseInt(row.totalGames) || 0,
      averageScore: parseFloat(row.averageScore) || 0,
    }));
  }

  async getUserRank(userId: string): Promise<{ rank: number; totalScore: number } | null> {
    const userStats = await this.gameHistoryRepository
      .createQueryBuilder('gh')
      .select('SUM(gh.score)', 'totalScore')
      .where('gh.userId = :userId', { userId })
      .getRawOne();

    if (!userStats || !userStats.totalScore) {
      return null;
    }

    const rank = await this.gameHistoryRepository
      .createQueryBuilder('gh')
      .select('COUNT(DISTINCT gh.userId)', 'rank')
      .where((qb) => {
        const subQuery = qb.subQuery()
          .select('SUM(gh2.score)', 'userTotal')
          .from(GameHistoryEntity, 'gh2')
          .groupBy('gh2.userId')
          .having('SUM(gh2.score) > :userTotal', { userTotal: userStats.totalScore })
          .getQuery();
        return `EXISTS (${subQuery})`;
      })
      .getRawOne();

    return {
      rank: (rank?.rank || 0) + 1,
      totalScore: parseInt(userStats.totalScore),
    };
  }

  async getGameById(gameId: string): Promise<GameHistoryEntity | null> {
    return await this.gameHistoryRepository.findOne({
      where: { id: gameId },
      relations: ['user'],
    });
  }

  async getUserStats(userId: string): Promise<{
    totalGames: number;
    totalScore: number;
    averageScore: number;
    topicStats: Record<string, { games: number; averageScore: number }>;
    difficultyStats: Record<string, { games: number; averageScore: number }>;
  }> {
    const games = await this.gameHistoryRepository.find({
      where: { userId },
    });

    const totalGames = games.length;
    const totalScore = games.reduce((sum, game) => sum + game.score, 0);
    const averageScore = totalGames > 0 ? totalScore / totalGames : 0;

    const topicStats: Record<string, { games: number; totalScore: number }> = {};
    const difficultyStats: Record<string, { games: number; totalScore: number }> = {};

    games.forEach(game => {
      if (game.topic) {
        if (!topicStats[game.topic]) {
          topicStats[game.topic] = { games: 0, totalScore: 0 };
        }
        topicStats[game.topic].games++;
        topicStats[game.topic].totalScore += game.score;
      }

      if (!difficultyStats[game.difficulty]) {
        difficultyStats[game.difficulty] = { games: 0, totalScore: 0 };
      }
      difficultyStats[game.difficulty].games++;
      difficultyStats[game.difficulty].totalScore += game.score;
    });

    return {
      totalGames,
      totalScore,
      averageScore,
      topicStats: Object.entries(topicStats).reduce((acc, [key, value]) => {
        acc[key] = {
          games: value.games,
          averageScore: value.totalScore / value.games,
        };
        return acc;
      }, {} as Record<string, { games: number; averageScore: number }>),
      difficultyStats: Object.entries(difficultyStats).reduce((acc, [key, value]) => {
        acc[key] = {
          games: value.games,
          averageScore: value.totalScore / value.games,
        };
        return acc;
      }, {} as Record<string, { games: number; averageScore: number }>),
    };
  }
}
