import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TriviaEntity } from "../../../shared/entities/trivia.entity";
import { UserEntity } from "../../../shared/entities/user.entity";
import { PriorityQueue } from "./priority-queue";
import { RedisService } from "../../../config/redis.service";
import { OpenAIProvider, AnthropicProvider } from "./llm.providers";
import { LLMProvider } from "../../../shared/types/llm.types";
import { APP_CONSTANTS } from "../../../constants/app.constants";

@Injectable()
export class TriviaService {
  private llmProviders: LLMProvider[] = [];
  private currentProviderIndex = 0;
  private queue: PriorityQueue;

  constructor(
    @InjectRepository(TriviaEntity)
    private readonly triviaRepo: Repository<TriviaEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly redisService: RedisService,
    @Inject("QUEUE_SERVICE")
    private readonly queueService: PriorityQueue
  ) {
    this.llmProviders = [new OpenAIProvider(), new AnthropicProvider()];
    this.queue = this.queueService;
  }

  private getNextProvider() {
    const provider = this.llmProviders[this.currentProviderIndex];
    this.currentProviderIndex =
      (this.currentProviderIndex + 1) % this.llmProviders.length;
    return provider;
  }

  async getTriviaQuestion(topic: string, difficulty: string, userId?: string) {
    const cacheKey = `trivia:${topic}:${difficulty}`;

    if (userId) {
      const unanswered = await this.triviaRepo.find({
        where: { topic, difficulty },
        order: { createdAt: "ASC" },
      });

      for (const q of unanswered) {
        const alreadyAnswered = await this.triviaRepo.findOne({
          where: { userId, question: q.question },
        });
        if (!alreadyAnswered) {
          return this.mapEntityToResponse(q);
        }
      }
    }

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const queueItemId = this.queue.enqueue({
      topic,
      difficulty,
      priority: this.calculatePriority(difficulty),
      userId,
    });

    const provider = this.getNextProvider();
    const question = await provider.generateTriviaQuestion(topic, difficulty);

    await this.redisService.set(
      cacheKey,
      JSON.stringify(question),
      APP_CONSTANTS.CACHE_TTL
    );

    await this.triviaRepo.save({
      ...question,
      userId: null,
      isCorrect: false,
    });

    this.queue.updateStatus(queueItemId, "completed");
    return question;
  }

  private calculatePriority(difficulty: string): number {
    switch (difficulty.toLowerCase()) {
      case "hard":
        return APP_CONSTANTS.PRIORITIES.HIGH;
      case "medium":
        return APP_CONSTANTS.PRIORITIES.MEDIUM;
      case "easy":
      default:
        return APP_CONSTANTS.PRIORITIES.LOW;
    }
  }

  private mapEntityToResponse(entity: TriviaEntity) {
    return {
      id: entity.id,
      topic: entity.topic,
      difficulty: entity.difficulty,
      question: entity.question,
      answers: entity.answers,
      correctAnswerIndex: entity.correctAnswerIndex,
      createdAt: entity.createdAt,
    };
  }

  async saveQuizHistory(data: Partial<TriviaEntity>) {
    if (data.userId) {
      let user = await this.userRepo.findOne({ where: { id: data.userId } });
      if (!user) {
        user = this.userRepo.create({ id: data.userId, username: data.userId });
      }
      if (data.isCorrect) {
        user.score = (user.score || 0) + 1;
      }
      await this.userRepo.save(user);
    }
    return this.triviaRepo.save(data);
  }

  async getUserScore(userId: string) {
    return this.triviaRepo.count({ where: { userId, isCorrect: true } });
  }

  async getLeaderboard(limit: number = APP_CONSTANTS.DEFAULT_PAGE_SIZE) {
    return this.triviaRepo
      .createQueryBuilder("trivia")
      .select("userId")
      .addSelect("COUNT(*)", "score")
      .where("userId IS NOT NULL")
      .andWhere("isCorrect = true")
      .groupBy("userId")
      .orderBy("score", "DESC")
      .limit(limit)
      .getRawMany();
  }
}
