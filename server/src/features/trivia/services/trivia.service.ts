import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TriviaEntity } from "../../../shared/entities/trivia.entity";
import { UserEntity } from "../../../shared/entities/user.entity";
import { PriorityQueue } from "./priority-queue";
import { RedisService } from "../../../config/redis.service";
import { OpenAIProvider, AnthropicProvider } from "./providers";
import { LLMProvider } from "../types/trivia.types";
import { APP_CONSTANTS } from "../../../constants/app.constants";
import { TRIVIA_CONSTANTS } from "../constants";

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
    // נטפל ברמת קושי מותאמת אישית
    const isCustomDifficulty = difficulty.startsWith(
      TRIVIA_CONSTANTS.CUSTOM_DIFFICULTY_PREFIX
    );
    const actualDifficulty = isCustomDifficulty
      ? difficulty.substring(TRIVIA_CONSTANTS.CUSTOM_DIFFICULTY_PREFIX.length)
      : difficulty;

    const cacheKey = `trivia:${topic}:${difficulty}`; // נשתמש ברמת הקושי המלאה לקאש

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
      return JSON.parse(cached as string);
    }

    const queueItemId = this.queue.enqueue({
      topic,
      difficulty,
      priority: this.calculatePriority(difficulty),
      userId,
    });

    const provider = this.getNextProvider();
    const question = await provider.generateTriviaQuestion(
      topic,
      actualDifficulty
    );

    await this.redisService.set(
      cacheKey,
      JSON.stringify(question),
      APP_CONSTANTS.CACHE_TTL
    );

    await this.triviaRepo.save({
      ...question,
      topic,
      difficulty, // נשמור את רמת הקושי המלאה (כולל custom:)
      userId: '',
      isCorrect: false,
      metadata: {
        custom_difficulty_description: isCustomDifficulty ? actualDifficulty : undefined
      }
    } as TriviaEntity);

    this.queue.updateStatus(queueItemId, "completed");
    return question;
  }

  private calculatePriority(difficulty: string): number {
    // אם זה רמת קושי מותאמת, נעביר לפונקציה נפרדת
    if (difficulty.startsWith(TRIVIA_CONSTANTS.CUSTOM_DIFFICULTY_PREFIX)) {
      return this.calculateCustomPriority(
        difficulty.substring(TRIVIA_CONSTANTS.CUSTOM_DIFFICULTY_PREFIX.length)
      );
    }

    switch (difficulty.toLowerCase()) {
      case "hard":
        return TRIVIA_CONSTANTS.PRIORITIES.HIGH;
      case "medium":
        return TRIVIA_CONSTANTS.PRIORITIES.MEDIUM;
      case "easy":
      default:
        return TRIVIA_CONSTANTS.PRIORITIES.LOW;
    }
  }

  private calculateCustomPriority(customDifficulty: string): number {
    // לוגיקה לחישוב עדיפות עבור רמת קושי מותאמת
    // למשל: לפי אורך התיאור או מילות מפתח
    const keywords = customDifficulty.toLowerCase();

    if (
      keywords.includes("expert") ||
      keywords.includes("professional") ||
      keywords.includes("advanced") ||
      keywords.includes("university") ||
      keywords.includes("phd") ||
      keywords.includes("doctorate")
    ) {
      return APP_CONSTANTS.PRIORITIES.HIGH;
    } else if (
      keywords.includes("intermediate") ||
      keywords.includes("moderate") ||
      keywords.includes("college") ||
      keywords.includes("high school")
    ) {
      return APP_CONSTANTS.PRIORITIES.MEDIUM;
    } else {
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

  // סטטיסטיקות רמות קושי
  async getDifficultyStats(userId?: string) {
    const queryBuilder = this.triviaRepo.createQueryBuilder("trivia");

    if (userId) {
      queryBuilder.where("userId = :userId", { userId });
    }

    const results = await queryBuilder
      .select("difficulty")
      .addSelect("COUNT(*)", "total")
      .addSelect("SUM(CASE WHEN isCorrect = true THEN 1 ELSE 0 END)", "correct")
      .groupBy("difficulty")
      .getRawMany();

    return results.reduce(
      (acc: Record<string, { correct: number; total: number }>, row: any) => {
        const difficulty = row.difficulty.startsWith(
          TRIVIA_CONSTANTS.CUSTOM_DIFFICULTY_PREFIX
        )
          ? "custom"
          : row.difficulty;

        if (!acc[difficulty]) {
          acc[difficulty] = { correct: 0, total: 0 };
        }

        acc[difficulty].correct += parseInt(row.correct);
        acc[difficulty].total += parseInt(row.total);

        return acc;
      },
      {} as Record<string, { correct: number; total: number }>
    );
  }

  // הצעות לרמות קושי מותאמות
  getCustomDifficultySuggestions(topic?: string) {
    const generalSuggestions = [
      "beginner level",
      "elementary school level",
      "middle school level",
      "high school level",
      "college level",
      "university level",
      "graduate level",
      "expert level",
      "professional level",
      "advanced professional level",
    ];

    const topicSpecificSuggestions: Record<string, string[]> = {
      science: [
        "high school chemistry",
        "university physics",
        "medical school level biology",
        "PhD level research concepts",
      ],
      sports: [
        "casual sports fan knowledge",
        "sports enthusiast level",
        "professional sports analyst level",
        "sports history expert",
      ],
      history: [
        "elementary historical facts",
        "high school world history",
        "university level historical analysis",
        "professional historian knowledge",
      ],
      cooking: [
        "beginner home cook",
        "intermediate cooking skills",
        "professional chef techniques",
        "culinary school graduate level",
      ],
      music: [
        "casual music listener",
        "music student level",
        "professional musician knowledge",
        "music theory expert",
      ],
      technology: [
        "basic computer user",
        "IT professional level",
        "software developer knowledge",
        "computer science PhD level",
      ],
    };

    let suggestions = [...generalSuggestions];

    if (topic) {
      const topicLower = topic.toLowerCase();
      const matchingCategory = Object.keys(topicSpecificSuggestions).find(
        (category) => topicLower.includes(category)
      );

      if (matchingCategory) {
        suggestions = [
          ...topicSpecificSuggestions[matchingCategory],
          ...suggestions,
        ];
      }
    }

    return {
      suggestions: suggestions.slice(0, 10), // מגביל ל-10 הצעות
      examples: [
        `${topic || "your topic"} for beginners`,
        `professional ${topic || "knowledge"}`,
        `university level ${topic || "concepts"}`,
        `expert ${topic || "analysis"}`,
      ],
    };
  }

  // חיפוש שאלות קיימות עם רמת קושי דומה
  async findSimilarCustomDifficulties(
    customDifficulty: string,
    limit: number = 5
  ) {
    const keywords = customDifficulty
      .toLowerCase()
      .split(" ")
      .filter((word) => word.length > 2);

    if (keywords.length === 0) return [];

    const queryBuilder = this.triviaRepo.createQueryBuilder("trivia");

    // חיפוש לפי מילות מפתח
    keywords.forEach((keyword, index) => {
      if (index === 0) {
        queryBuilder.where("difficulty LIKE :keyword0", {
          [`keyword${index}`]: `%${keyword}%`,
        });
      } else {
        queryBuilder.orWhere(`difficulty LIKE :keyword${index}`, {
          [`keyword${index}`]: `%${keyword}%`,
        });
      }
    });

    const results = await queryBuilder
      .andWhere("difficulty LIKE :customPrefix", {
        customPrefix: `${TRIVIA_CONSTANTS.CUSTOM_DIFFICULTY_PREFIX}%`,
      })
      .select("difficulty")
      .addSelect("COUNT(*)", "usage_count")
      .groupBy("difficulty")
      .orderBy("usage_count", "DESC")
      .limit(limit)
      .getRawMany();

    return results.map((row) => ({
      difficulty: row.difficulty.substring(
        TRIVIA_CONSTANTS.CUSTOM_DIFFICULTY_PREFIX.length
      ),
      usageCount: parseInt(row.usage_count),
    }));
  }

  // ולידציה מתקדמת לרמת קושי מותאמת
  validateCustomDifficulty(customDifficulty: string): {
    isValid: boolean;
    suggestions?: string[];
  } {
    const text = customDifficulty.trim().toLowerCase();

    // רשימת מילות מפתח מומלצות
    const recommendedKeywords = [
      "beginner",
      "elementary",
      "basic",
      "simple",
      "easy",
      "intermediate",
      "moderate",
      "medium",
      "standard",
      "advanced",
      "expert",
      "professional",
      "complex",
      "difficult",
      "university",
      "college",
      "school",
      "academic",
      "level",
      "grade",
      "knowledge",
      "skills",
    ];

    const hasRecommendedKeyword = recommendedKeywords.some((keyword) =>
      text.includes(keyword)
    );

    // בדיקות תקינות
    if (text.length < 5) {
      return {
        isValid: false,
        suggestions: [
          "Make your description more specific (at least 5 characters)",
          "Example: 'high school level biology'",
        ],
      };
    }

    if (
      !hasRecommendedKeyword &&
      !text.match(/\b(phd|doctorate|master|bachelor)\b/)
    ) {
      return {
        isValid: false,
        suggestions: [
          "Include a difficulty indicator like 'beginner', 'advanced', 'professional', etc.",
          "Examples: 'beginner cooking', 'professional sports knowledge', 'university level physics'",
        ],
      };
    }

    return { isValid: true };
  }
}
