import { TriviaQuestion } from "@shared/types/trivia.types";

export interface QuestionCacheEntry {
  question: TriviaQuestion;
  createdAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

export class QuestionCache {
  private cache = new Map<string, QuestionCacheEntry>();
  private readonly maxCacheSize = 1000;
  private readonly cacheExpiryHours = 24;

  /**
   * Generate a unique key for a question to detect duplicates
   */
  private generateQuestionKey(question: TriviaQuestion): string {
    const normalizedQuestion = question.question.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const sortedAnswers = question.answers
      .map(a => a.text.toLowerCase().replace(/[^\w\s]/g, '').trim())
      .sort()
      .join('|');
    
    return `${question.topic}:${normalizedQuestion}:${sortedAnswers}`;
  }

  /**
   * Check if a similar question already exists
   */
  isDuplicate(question: TriviaQuestion): boolean {
    const key = this.generateQuestionKey(question);
    return this.cache.has(key);
  }

  /**
   * Add question to cache
   */
  addQuestion(question: TriviaQuestion): void {
    const key = this.generateQuestionKey(question);
    
    // Clean expired entries if cache is getting full
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanExpiredEntries();
    }
    
    this.cache.set(key, {
      question,
      createdAt: new Date(),
      accessCount: 1,
      lastAccessed: new Date()
    });
  }

  /**
   * Get cached question if exists
   */
  getQuestion(questionKey: string): TriviaQuestion | null {
    const entry = this.cache.get(questionKey);
    if (!entry) return null;
    
    // Check if expired
    const hoursAgo = (Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursAgo > this.cacheExpiryHours) {
      this.cache.delete(questionKey);
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = new Date();
    
    return entry.question;
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    const expiryMs = this.cacheExpiryHours * 60 * 60 * 1000;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt.getTime() > expiryMs) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number; mostAccessed: QuestionCacheEntry[] } {
    const entries = Array.from(this.cache.values());
    const totalAccess = entries.reduce((sum, e) => sum + e.accessCount, 0);
    const mostAccessed = entries
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    return {
      size: this.cache.size,
      hitRate: totalAccess > 0 ? entries.length / totalAccess : 0,
      mostAccessed
    };
  }
}
