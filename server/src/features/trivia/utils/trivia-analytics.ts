import { TriviaQuestion } from "@shared/types/trivia.types";

export interface QuestionStats {
  totalQuestions: number;
  byTopic: Record<string, number>;
  byDifficulty: Record<string, number>;
  averageAnswerCount: number;
  questionQualityScore: number;
  duplicateRate: number;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  cacheHitRate: number;
}

export class TriviaAnalytics {
  private questionHistory: TriviaQuestion[] = [];
  private responseTimeHistory: number[] = [];
  private errorCount = 0;
  private totalRequests = 0;

  recordQuestion(question: TriviaQuestion, responseTime: number): void {
    this.questionHistory.push(question);
    this.responseTimeHistory.push(responseTime);
    this.totalRequests++;
    
    // Keep only last 1000 questions for memory management
    if (this.questionHistory.length > 1000) {
      this.questionHistory.shift();
    }
    
    if (this.responseTimeHistory.length > 1000) {
      this.responseTimeHistory.shift();
    }
  }

  recordError(): void {
    this.errorCount++;
    this.totalRequests++;
  }

  getQuestionStats(): QuestionStats {
    const byTopic: Record<string, number> = {};
    const byDifficulty: Record<string, number> = {};
    let totalAnswers = 0;
    let qualityScoreSum = 0;
    let duplicateCount = 0;

    // Track seen question texts for duplicate detection
    const seenQuestions = new Set<string>();

    this.questionHistory.forEach(question => {
      // Topic statistics
      byTopic[question.topic] = (byTopic[question.topic] || 0) + 1;
      
      // Difficulty statistics
      byDifficulty[question.difficulty] = (byDifficulty[question.difficulty] || 0) + 1;
      
      // Answer count
      totalAnswers += question.answers.length;
      
      // Quality score (basic heuristic)
      let qualityScore = 100;
      if (question.question.length < 20) qualityScore -= 20;
      if (question.answers.some(a => a.text.length < 3)) qualityScore -= 15;
      if (!question.question.includes('?')) qualityScore -= 10;
      qualityScoreSum += Math.max(0, qualityScore);
      
      // Duplicate detection
      const normalizedQuestion = question.question.toLowerCase().replace(/[^\w\s]/g, '');
      if (seenQuestions.has(normalizedQuestion)) {
        duplicateCount++;
      } else {
        seenQuestions.add(normalizedQuestion);
      }
    });

    return {
      totalQuestions: this.questionHistory.length,
      byTopic,
      byDifficulty,
      averageAnswerCount: this.questionHistory.length > 0 ? totalAnswers / this.questionHistory.length : 0,
      questionQualityScore: this.questionHistory.length > 0 ? qualityScoreSum / this.questionHistory.length : 0,
      duplicateRate: this.questionHistory.length > 0 ? (duplicateCount / this.questionHistory.length) * 100 : 0
    };
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const avgResponseTime = this.responseTimeHistory.length > 0 
      ? this.responseTimeHistory.reduce((sum, time) => sum + time, 0) / this.responseTimeHistory.length 
      : 0;

    const successCount = this.totalRequests - this.errorCount;
    const successRate = this.totalRequests > 0 ? (successCount / this.totalRequests) * 100 : 0;
    const errorRate = this.totalRequests > 0 ? (this.errorCount / this.totalRequests) * 100 : 0;

    return {
      averageResponseTime: avgResponseTime,
      successRate,
      errorRate,
      cacheHitRate: 0 // This would be calculated from cache statistics
    };
  }

  /**
   * Get insights about question generation patterns
   */
  getInsights(): string[] {
    const stats = this.getQuestionStats();
    const performance = this.getPerformanceMetrics();
    const insights: string[] = [];

    // Quality insights
    if (stats.questionQualityScore < 70) {
      insights.push("Question quality is below optimal. Consider reviewing LLM prompts.");
    }

    // Duplicate insights
    if (stats.duplicateRate > 5) {
      insights.push(`High duplicate rate detected (${stats.duplicateRate.toFixed(1)}%). Consider improving question diversity.`);
    }

    // Performance insights
    if (performance.averageResponseTime > 5000) {
      insights.push("Response times are high. Consider implementing caching or optimizing API calls.");
    }

    if (performance.errorRate > 10) {
      insights.push("High error rate detected. Check API configurations and prompts.");
    }

    // Topic distribution insights
    const topicCounts = Object.values(stats.byTopic);
    const maxQuestions = Math.max(...topicCounts);
    const minQuestions = Math.min(...topicCounts);
    if (maxQuestions > minQuestions * 3) {
      insights.push("Uneven topic distribution detected. Some topics are much more popular than others.");
    }

    return insights;
  }

  reset(): void {
    this.questionHistory = [];
    this.responseTimeHistory = [];
    this.errorCount = 0;
    this.totalRequests = 0;
  }
}

// Global analytics instance
export const triviaAnalytics = new TriviaAnalytics();
