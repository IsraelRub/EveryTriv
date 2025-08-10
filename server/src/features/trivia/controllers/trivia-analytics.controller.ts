import { Controller, Get } from '@nestjs/common';
import { triviaAnalytics } from '../utils/trivia-analytics';

@Controller('trivia/analytics')
export class TriviaAnalyticsController {
  
  @Get('stats')
  getQuestionStats() {
    return {
      success: true,
      data: triviaAnalytics.getQuestionStats()
    };
  }

  @Get('performance')
  getPerformanceMetrics() {
    return {
      success: true,
      data: triviaAnalytics.getPerformanceMetrics()
    };
  }

  @Get('insights')
  getInsights() {
    return {
      success: true,
      data: {
        insights: triviaAnalytics.getInsights(),
        stats: triviaAnalytics.getQuestionStats(),
        performance: triviaAnalytics.getPerformanceMetrics()
      }
    };
  }

  @Get('reset')
  resetAnalytics() {
    triviaAnalytics.reset();
    return {
      success: true,
      message: 'Analytics data has been reset'
    };
  }
}
