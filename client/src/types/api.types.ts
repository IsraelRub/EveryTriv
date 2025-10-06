/**
 * API Types for EveryTriv Client
 *
 * @module ClientApiTypes
 * @description Client-specific API service interface and response types
 */
import type {
  AuthCredentials,
  AuthResponse,
  CompleteUserAnalytics,
  CreateGameHistoryDto,
  DifficultyStatsData,
  LeaderboardEntry,
  StorageValue,
  SubscriptionData,
  TopicStatsData,
  TriviaQuestion,
  TriviaRequest,
  UrlResponse,
  User,
  UserAnalyticsQuery,
  UserPreferencesUpdate,
  UserProfileUpdateData,
  UserRankData,
} from '@shared';
import type { ApiResponse } from '@shared/types/infrastructure/api.types';
import type {
  LanguageValidationOptions,
  LanguageValidationResult,
} from '@shared/types/language.types';

import type { PointBalance, PointPurchaseOption, PointTransaction } from './points.types';

export type { ApiResponse } from '@shared/types/infrastructure/api.types';

export interface ClientApiService {
  // HTTP methods
  get<T>(url: string, config?: RequestInit): Promise<ApiResponse<T>>;
  post<T>(url: string, data?: StorageValue, config?: RequestInit): Promise<ApiResponse<T>>;
  put<T>(url: string, data?: StorageValue, config?: RequestInit): Promise<ApiResponse<T>>;
  delete<T>(url: string, config?: RequestInit): Promise<ApiResponse<T>>;

  // Auth methods
  login(credentials: AuthCredentials): Promise<AuthResponse>;
  register(credentials: AuthCredentials): Promise<AuthResponse>;
  logout(): Promise<void>;
  refreshToken(): Promise<{ accessToken: string }>;

  // User methods
  getCurrentUser(): Promise<unknown>;
  getUserProfile(): Promise<unknown>;
  updateUserProfile(data: UserProfileUpdateData): Promise<unknown>;
  getUserCredits(): Promise<unknown>;
  deductCredits(amount: number): Promise<unknown>;

  // Game history methods
  saveGameHistory(data: CreateGameHistoryDto): Promise<unknown>;
  getUserGameHistory(limit?: number, offset?: number): Promise<unknown>;

  // Leaderboard methods
  getLeaderboardEntries(limit?: number): Promise<LeaderboardEntry[]>;
  getUserRank(): Promise<unknown>;
  getUserStats(): Promise<unknown>;

  // Game methods
  getGameById(gameId: string): Promise<TriviaQuestion>;

  // Points methods
  getPointBalance(): Promise<PointBalance>;
  getPointPackages(): Promise<PointPurchaseOption[]>;
  canPlay(questionCount: number): Promise<{ allowed: boolean; reason?: string }>;
  deductPoints(questionCount: number, gameMode: string): Promise<PointBalance>;
  getPointHistory(limit?: number): Promise<PointTransaction[]>;
  confirmPointPurchase(paymentIntentId: string): Promise<PointBalance>;

  // Trivia methods
  getTrivia(request: TriviaRequest): Promise<TriviaQuestion>;
  saveHistory(data: CreateGameHistoryDto): Promise<unknown>;

  // Stats methods
  getDifficultyStats(query?: UserAnalyticsQuery): Promise<DifficultyStatsData>;
  getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
  getUserScore(): Promise<number>;

  // Validation methods
  validateCustomDifficulty(customText: string): Promise<{ isValid: boolean; errors?: string[] }>;
  validateLanguage(
    text: string,
    options: LanguageValidationOptions
  ): Promise<LanguageValidationResult>;

  // User preferences methods
  updateUserPreferences(preferences: UserPreferencesUpdate): Promise<void>;

  // User search methods
  searchUsers(
    query: string,
    limit?: number
  ): Promise<{ query: string; results: User[]; totalResults: number }>;

  // Account management methods
  deleteUserAccount(): Promise<{ success: boolean; message: string }>;

  // AI Providers monitoring methods
  getAiProviderStats(): Promise<{
    totalProviders: number;
    currentProviderIndex: number;
    providers: string[];
    providerDetails: Record<string, unknown>;
    timestamp: string;
  }>;
  getAvailableProvidersCount(): Promise<{
    availableProviders: number;
    timestamp: string;
  }>;
  getAiProvidersHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
    availableProviders?: number;
    totalProviders?: number;
    error?: string;
    timestamp: string;
  }>;

  // Language validation methods
  validateLanguage(
    text: string,
    options?: {
      language?: string;
      enableSpellCheck?: boolean;
      enableGrammarCheck?: boolean;
    }
  ): Promise<{
    isValid: boolean;
    errors: string[];
    suggestions: string[];
    language?: string;
  }>;

  // Analytics dashboard methods
  getUserAnalytics(): Promise<CompleteUserAnalytics>;
  getPopularTopics(query?: UserAnalyticsQuery): Promise<TopicStatsData>;
  getDifficultyStats(query?: UserAnalyticsQuery): Promise<DifficultyStatsData>;

  // Leaderboard features methods
  getUserRanking(): Promise<UserRankData>;
  updateUserRanking(): Promise<{ success: boolean; message: string }>;
  getGlobalLeaderboard(
    limit?: number,
    offset?: number
  ): Promise<{
    leaderboard: LeaderboardEntry[];
    pagination: { total: number; limit: number; offset: number };
  }>;
  getLeaderboardByPeriod(
    period: 'weekly' | 'monthly' | 'yearly',
    limit?: number
  ): Promise<LeaderboardEntry[]>;

  // Points system methods
  deductPoints(questionCount: number, gameMode: string): Promise<PointBalance>;

  // New game history management methods
  deleteGameHistory(gameId: string): Promise<{ success: boolean; message: string }>;
  clearGameHistory(): Promise<{ success: boolean; message: string; deletedCount: number }>;

  // New user management methods
  updateUserField(field: string, value: unknown): Promise<unknown>;
  updateSinglePreference(preference: string, value: unknown): Promise<unknown>;
  getUserById(userId: string): Promise<unknown>;
  updateUserCredits(userId: string, amount: number, reason: string): Promise<unknown>;
  deleteUser(userId: string): Promise<unknown>;
  updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned'): Promise<unknown>;
  purchasePoints(packageId: string): Promise<UrlResponse>;

  // Subscription management methods
  createSubscription(plan: string, billingCycle?: string): Promise<SubscriptionData>;
  cancelSubscription(): Promise<{ success: boolean; message: string }>;
}
