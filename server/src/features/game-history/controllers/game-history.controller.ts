import { Controller, Get, Post, Body, UseGuards, Request, Query, Param } from '@nestjs/common';
import { GameHistoryService } from '../services/game-history.service';
import { AuthGuard } from '../../auth/guards/auth.guard';

@Controller('game-history')
export class GameHistoryController {
  constructor(private readonly gameHistoryService: GameHistoryService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createGameHistory(
    @Request() req: Request & { user: any },
    @Body() gameData: {
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
    },
  ) {
    return await this.gameHistoryService.createGameHistory({
      userId: req.user.id,
      ...gameData,
    });
  }

  @Get('user')
  @UseGuards(AuthGuard)
  async getUserGameHistory(
    @Request() req: Request & { user: any },
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return await this.gameHistoryService.getUserGameHistory(
      req.user.id,
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get('leaderboard')
  async getGlobalLeaderboard(@Query('limit') limit?: string) {
    return await this.gameHistoryService.getGlobalLeaderboard(
      limit ? parseInt(limit) : 100,
    );
  }

  @Get('user/rank')
  @UseGuards(AuthGuard)
  async getUserRank(@Request() req: Request & { user: any }) {
    return await this.gameHistoryService.getUserRank(req.user.id);
  }

  @Get('user/stats')
  @UseGuards(AuthGuard)
  async getUserStats(@Request() req: Request & { user: any }) {
    return await this.gameHistoryService.getUserStats(req.user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getGameById(@Param('id') id: string) {
    return await this.gameHistoryService.getGameById(id);
  }
}
