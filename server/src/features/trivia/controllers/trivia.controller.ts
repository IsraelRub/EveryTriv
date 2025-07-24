import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { TriviaService } from "../services/trivia.service";
import { APP_CONSTANTS } from "../../../constants/app.constants";

@Controller(`${APP_CONSTANTS.API_VERSION}/trivia`)
export class TriviaController {
  constructor(private readonly triviaService: TriviaService) {}

  @Post()
  async getTrivia(
    @Body() body: { topic: string; difficulty: string; userId?: string }
  ) {
    const { topic, difficulty, userId } = body;
    if (!topic || !difficulty) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: "Topic and difficulty are required",
        },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const data = await this.triviaService.getTriviaQuestion(
        topic,
        difficulty,
        userId
      );
      return {
        data,
        status: HttpStatus.OK,
      };
    } catch (err) {
      throw new HttpException(
        { status: HttpStatus.INTERNAL_SERVER_ERROR, message: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("history")
  async saveHistory(@Body() body) {
    return this.triviaService.saveQuizHistory(body);
  }

  @Get("score")
  async getUserScore(@Query("userId") userId: string) {
    if (!userId) {
      throw new HttpException(
        { status: HttpStatus.BAD_REQUEST, message: "userId required" },
        HttpStatus.BAD_REQUEST
      );
    }
    return this.triviaService.getUserScore(userId);
  }

  @Get("leaderboard")
  async getLeaderboard(
    @Query("limit") limit = APP_CONSTANTS.DEFAULT_PAGE_SIZE
  ) {
    return this.triviaService.getLeaderboard(Number(limit));
  }
}
