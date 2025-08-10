import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  HttpException,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from "@nestjs/common";
import { InputValidationService } from "../../../common/validation/input-validation.service";
import { TriviaService } from "../services/trivia.service";
import { TriviaRequestDto, TriviaHistoryDto } from "./trivia.dto";
import { APP_CONSTANTS } from "../../../constants/app.constants";
import { TRIVIA_CONSTANTS } from "../constants";
import { LoggerService } from "../../../shared/modules/logger/logger.service";

@Controller(`${APP_CONSTANTS.API_VERSION}/trivia`)
export class TriviaController {
  constructor(
    private readonly triviaService: TriviaService,
    private readonly validationService: InputValidationService,
    private readonly logger: LoggerService,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getTrivia(@Body() body: TriviaRequestDto) {
    const startTime = Date.now();
    const { topic, difficulty, questionCount, userId } = body;

    this.logger.api(`📝 Trivia request received`, {
      topic: topic.substring(0, 50) + (topic.length > 50 ? '...' : ''),
      difficulty,
      questionCount,
      userId: userId || 'anonymous',
      requestSize: JSON.stringify(body).length
    });

    // Validate topic and custom difficulty text
    const validationResults = await Promise.all([
      this.validationService.validateInput(topic),
      difficulty.startsWith(TRIVIA_CONSTANTS.CUSTOM_DIFFICULTY_PREFIX)
        ? this.validationService.validateInput(
            difficulty.substring(TRIVIA_CONSTANTS.CUSTOM_DIFFICULTY_PREFIX.length)
          )
        : Promise.resolve({ isValid: true, errors: [] }),
    ]);

    const [topicValidation, difficultyValidation] = validationResults;

    if (!topicValidation.isValid) {
      throw new BadRequestException({
        message: 'Invalid topic text',
        errors: topicValidation.errors,
      });
    }

    if (!difficultyValidation.isValid) {
      throw new BadRequestException({
        message: 'Invalid custom difficulty text',
        errors: difficultyValidation.errors,
      });
    }

    // ולידציה נוספת לרמת קושי מותאמת
    if (difficulty.startsWith(TRIVIA_CONSTANTS.CUSTOM_DIFFICULTY_PREFIX)) {
      const customDifficultyText = difficulty.substring(TRIVIA_CONSTANTS.CUSTOM_DIFFICULTY_PREFIX.length);
      
      if (customDifficultyText.trim().length < 3) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            message: "Custom difficulty description must be at least 3 characters long",
          },
          HttpStatus.BAD_REQUEST
        );
      }

      if (customDifficultyText.length > 200) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            message: "Custom difficulty description must be less than 200 characters",
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // בדיקת תוכן לא הולם (בסיסי)
      const inappropriateWords = ['hate', 'violence', 'explicit'];
      const lowerCaseText = customDifficultyText.toLowerCase();
      
      if (inappropriateWords.some(word => lowerCaseText.includes(word))) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            message: "Custom difficulty description contains inappropriate content",
          },
          HttpStatus.BAD_REQUEST
        );
      }
    }

    try {
      const data = await this.triviaService.getTriviaQuestion(
        topic,
        difficulty,
        questionCount,
        userId
      );
      
      const duration = Date.now() - startTime;
      this.logger.logPerformance(`Trivia request completed`, duration, {
        success: true,
        questionsGenerated: Array.isArray(data) ? data.length : 1,
        difficulty,
        questionCount,
        responseSize: JSON.stringify(data).length
      });
      
      return {
        data,
        status: HttpStatus.OK,
        message: difficulty.startsWith(TRIVIA_CONSTANTS.CUSTOM_DIFFICULTY_PREFIX) 
          ? "Custom difficulty trivia question generated successfully"
          : "Trivia question generated successfully"
      };
    } catch (err) {
      const duration = Date.now() - startTime;
      this.logger.error(`❌ Trivia request failed`, {
        duration,
        topic: topic.substring(0, 50),
        difficulty,
        questionCount,
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      
      this.logger.error("Error generating trivia question", { 
        topic, 
        difficulty, 
        questionCount, 
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        requestId: `trivia-${Date.now()}`
      });
      
      // טיפול שגיאות ספציפי לרמות קושי מותאמות
      if (difficulty.startsWith(TRIVIA_CONSTANTS.CUSTOM_DIFFICULTY_PREFIX)) {
        throw new HttpException(
          { 
            status: HttpStatus.INTERNAL_SERVER_ERROR, 
            message: "Failed to generate custom difficulty question. Please try with a clearer difficulty description.",
            suggestion: "Try descriptions like 'university level biology', 'beginner cooking', or 'professional sports knowledge'"
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      throw new HttpException(
        { 
          status: HttpStatus.INTERNAL_SERVER_ERROR, 
          message: err instanceof Error ? err.message : "Failed to generate trivia question"
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("history")
  @UsePipes(new ValidationPipe({ transform: true }))
  async saveHistory(@Body() body: TriviaHistoryDto) {
    try {
      const result = await this.triviaService.saveQuizHistory(body);
      return {
        data: result,
        status: HttpStatus.CREATED,
        message: "Quiz history saved successfully"
      };
    } catch (err) {
      throw new HttpException(
        { 
          status: HttpStatus.INTERNAL_SERVER_ERROR, 
          message: "Failed to save quiz history"
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("score")
  async getUserScore(@Query("userId") userId: string) {
    if (!userId) {
      throw new HttpException(
        { 
          status: HttpStatus.BAD_REQUEST, 
          message: "userId is required" 
        },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const score = await this.triviaService.getUserScore(userId);
      return {
        data: score,
        status: HttpStatus.OK,
        message: "User score retrieved successfully"
      };
    } catch (err) {
      throw new HttpException(
        { 
          status: HttpStatus.INTERNAL_SERVER_ERROR, 
          message: "Failed to retrieve user score"
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get("leaderboard")
  async getLeaderboard(
    @Query("limit") limit = APP_CONSTANTS.DEFAULT_PAGE_SIZE
  ) {
    const parsedLimit = Math.min(Math.max(Number(limit), 1), 100); // מגביל בין 1 ל-100

    try {
      const leaderboard = await this.triviaService.getLeaderboard(parsedLimit);
      return {
        data: leaderboard,
        status: HttpStatus.OK,
        message: "Leaderboard retrieved successfully",
        meta: {
          limit: parsedLimit,
          total: leaderboard.length
        }
      };
    } catch (err) {
      throw new HttpException(
        { 
          status: HttpStatus.INTERNAL_SERVER_ERROR, 
          message: "Failed to retrieve leaderboard"
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // נקודת קצה חדשה לקבלת סטטיסטיקות רמות קושי
  @Get("difficulty-stats")
  async getDifficultyStats(@Query("userId") userId?: string) {
    try {
      const stats = await this.triviaService.getDifficultyStats(userId);
      return {
        data: stats,
        status: HttpStatus.OK,
        message: "Difficulty statistics retrieved successfully"
      };
    } catch (err) {
      throw new HttpException(
        { 
          status: HttpStatus.INTERNAL_SERVER_ERROR, 
          message: "Failed to retrieve difficulty statistics"
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // נקודת קצה לקבלת הצעות לרמות קושי מותאמות
  @Get("custom-difficulty-suggestions")
  async getCustomDifficultySuggestions(@Query("topic") topic?: string) {
    const suggestions = this.triviaService.getCustomDifficultySuggestions(topic);
    return {
      data: suggestions,
      status: HttpStatus.OK,
      message: "Custom difficulty suggestions retrieved successfully"
    };
  }
}