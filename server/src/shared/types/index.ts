// Server types export

// Server-specific types
export type SupportedModel =
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'mistral-large-latest'
  | 'mistral-small-latest';

export interface AIMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface LLMProvider {
  generateTriviaQuestion(
    topic: string,
    difficulty: string
  ): Promise<{
    question: string;
    answers: Array<{ text: string; isCorrect: boolean }>;
    correctAnswerIndex: number;
  }>;
}

export interface QueueItem {
  id: string;
  topic: string;
  difficulty: string;
  priority: number;
  userId?: string;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface QueueStats {
  totalItems: number;
  pendingItems: number;
  processingItems: number;
  completedItems: number;
  failedItems: number;
  averageWaitTime: number;
}

// Database entity types
export interface TriviaEntity {
  id: string;
  topic: string;
  difficulty: string;
  question: string;
  answers: Array<{ text: string; isCorrect: boolean }>;
  correctAnswerIndex: number;
  userId: string | null;
  isCorrect: boolean;
  createdAt: Date;
}

export interface UserEntity {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AchievementEntity {
  id: string;
  userId: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

export interface UserStatsEntity {
  id: string;
  userId: string;
  topicsPlayed: Record<string, number>;
  difficultyStats: Record<string, { correct: number; total: number }>;
  totalQuestions: number;
  correctAnswers: number;
  lastPlayed: Date;
}

// DTO types
export interface TriviaRequestDto {
  topic: string;
  difficulty: string;
  questionCount: number;
  userId?: string;
}

export interface TriviaHistoryDto {
  userId: string;
  question: string;
  answers: Array<{ text: string; isCorrect: boolean }>;
  correctAnswerIndex: number;
  isCorrect: boolean;
  topic: string;
  difficulty: string;
}

export interface UserProfileDto {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  score: number;
  achievements: AchievementEntity[];
  stats: UserStatsEntity;
}

// Configuration types
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  ttl: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiVersion: string;
  domain: string;
  corsOrigin: string;
  cookieSecret: string;
}

export interface LLMConfig {
  openaiApiKey: string;
  anthropicApiKey: string;
  defaultModel: SupportedModel;
  timeout: number;
  maxRetries: number;
}

// Service types
export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export interface LoggerService {
  log(message: string, context?: string): void;
  error(message: string, trace?: string, context?: string): void;
  warn(message: string, context?: string): void;
  debug(message: string, context?: string): void;
  verbose(message: string, context?: string): void;
}