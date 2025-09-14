/**
 * Client API service
 * Handles HTTP requests to the server and returns typed DTOs
 * @module ClientApiService
 * @used_by client/src/hooks/api/**, client/src/views/**
 */
import {
  ApiError,
  ApiResponse,
  AuthCredentials,
  AuthResponse,
  BasicValue,
  CanPlayResponse,
  CreateGameHistoryDto,
  DifficultyStatsData,
  LeaderboardEntry,
  PointPurchaseOption,
  StorageValue,
  SubscriptionData,
  SubscriptionPlans,
  TopicStatsData,
  TriviaQuestion,
  TriviaRequest,
  CompleteUserAnalytics,
  UrlResponse,
  User,
  UserAnalyticsQuery,
  UserRankData,
  UserStatsData,
} from '@shared';
import {
  API_BASE_URL,
  HTTP_CLIENT_CONFIG,
  HTTP_STATUS_CODES,
} from '@shared/constants/infrastructure/http.constants';
import { UserPreferencesUpdate } from '@shared/types/domain/user/profile.types';
import { UserProfileUpdateData } from '@shared/types/domain/user/user.types';
import {
  CustomDifficultyValidationResponse,
  ValidateCustomDifficultyRequest,
} from '@shared/types/domain/validation/validation.types';

import { CLIENT_STORAGE_KEYS } from '../../constants';
import type { ClientApiService } from '../../types';
import { PointBalance, PointTransaction } from '../../types';
import { storageService } from '../storage';

class ApiService implements ClientApiService {
  private baseURL: string;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || API_BASE_URL;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const tokenResult = await storageService.get<string>('accessToken');
    const token = tokenResult.success ? tokenResult.data : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryRequest<T>(
    requestFn: () => Promise<ApiResponse<T>>,
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    try {
      return await requestFn();
    } catch (error) {
      const apiError = error as ApiError;

      // Only retry on server errors (5xx) or network errors
      const shouldRetry =
        attempt < this.retryAttempts &&
        ((apiError as ApiError & { isServerError?: boolean }).isServerError ||
          apiError.statusCode === 0);

      if (shouldRetry) {
        await this.sleep(this.retryDelay * attempt);
        return this.retryRequest(requestFn, attempt + 1);
      }

      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      let errorData: Record<string, unknown> = {};
      const contentType = response.headers.get('content-type');

      // Try to parse error response based on content type
      if (contentType && contentType.includes('application/json')) {
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: 'Failed to parse error response' };
        }
      } else {
        errorData = { message: await response.text().catch(() => 'Unknown error') };
      }

      // Use HTTP_STATUS_CODES for better error handling
      const isServerError =
        response.status >= HTTP_STATUS_CODES.SERVER_ERROR_MIN &&
        response.status <= HTTP_STATUS_CODES.SERVER_ERROR_MAX;
      const isClientError =
        response.status >= HTTP_STATUS_CODES.BAD_REQUEST &&
        response.status < HTTP_STATUS_CODES.SERVER_ERROR_MIN;

      // Enhanced error message with more context
      const errorMessage =
        errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;

      throw {
        message: errorMessage,
        statusCode: response.status,
        details: errorData,
        isServerError,
        isClientError,
        url: response.url,
        method: 'unknown', // Will be set by the calling method
      } as ApiError & {
        isServerError: boolean;
        isClientError: boolean;
        url: string;
        method: string;
      };
    }

    const contentType = response.headers.get('content-type');
    let responseData: unknown;

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      // Handle non-JSON responses
      responseData = await response.text();
    }

    // Handle server response format: { success: true, data: T, timestamp: string }
    if (
      responseData &&
      typeof responseData === 'object' &&
      (responseData as { success?: unknown }).success !== undefined
    ) {
      const typedResponse = responseData as { success: boolean; data: T; timestamp: string };
      return {
        data: typedResponse.data,
        success: typedResponse.success,
        statusCode: response.status,
        timestamp: typedResponse.timestamp,
      } as ApiResponse<T>;
    }

    // Fallback for direct data responses
    return {
      data: responseData,
      success: true,
      statusCode: response.status,
    } as ApiResponse<T>;
  }

  // Removed handleError method as it's no longer used with retry logic

  async get<T>(url: string, config?: RequestInit): Promise<ApiResponse<T>> {
    const requestFn = async (): Promise<ApiResponse<T>> => {
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'GET',
        headers: {
          ...HTTP_CLIENT_CONFIG.DEFAULT_HEADERS,
          ...authHeaders,
          ...config?.headers,
        },
        ...config,
      });
      return this.handleResponse<T>(response);
    };

    return this.retryRequest(requestFn);
  }

  async post<T>(url: string, data?: unknown, config?: RequestInit): Promise<ApiResponse<T>> {
    const requestFn = async (): Promise<ApiResponse<T>> => {
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers: {
          ...HTTP_CLIENT_CONFIG.DEFAULT_HEADERS,
          ...authHeaders,
          ...config?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        ...config,
      });
      return this.handleResponse<T>(response);
    };

    return this.retryRequest(requestFn);
  }

  async put<T>(url: string, data?: unknown, config?: RequestInit): Promise<ApiResponse<T>> {
    const requestFn = async (): Promise<ApiResponse<T>> => {
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...config?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        ...config,
      });
      return this.handleResponse<T>(response);
    };

    return this.retryRequest(requestFn);
  }

  async patch<T>(url: string, data?: StorageValue, config?: RequestInit): Promise<ApiResponse<T>> {
    const requestFn = async (): Promise<ApiResponse<T>> => {
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...config?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        ...config,
      });
      return this.handleResponse<T>(response);
    };

    return this.retryRequest(requestFn);
  }

  async delete<T>(url: string, config?: RequestInit): Promise<ApiResponse<T>> {
    const requestFn = async (): Promise<ApiResponse<T>> => {
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...config?.headers,
        },
        ...config,
      });
      return this.handleResponse<T>(response);
    };

    return this.retryRequest(requestFn);
  }

  // Auth methods
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/login', credentials);

    // Store tokens securely using centralized constants
    if (response.data.accessToken) {
      await storageService.set(CLIENT_STORAGE_KEYS.AUTH_TOKEN, response.data.accessToken);
    }
    if ((response.data as { refresh_token?: string }).refresh_token) {
      await storageService.set(
        CLIENT_STORAGE_KEYS.REFRESH_TOKEN,
        (response.data as { refresh_token?: string }).refresh_token!
      );
    }

    return response.data;
  }

  async register(credentials: AuthCredentials): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/register', credentials);

    // Store tokens securely using centralized constants
    if (response.data.accessToken) {
      await storageService.set(CLIENT_STORAGE_KEYS.AUTH_TOKEN, response.data.accessToken);
    }
    if ((response.data as { refresh_token?: string }).refresh_token) {
      await storageService.set(
        CLIENT_STORAGE_KEYS.REFRESH_TOKEN,
        (response.data as { refresh_token?: string }).refresh_token!
      );
    }

    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await this.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if server request fails
      console.warn('Logout request failed, but clearing local tokens:', error);
    } finally {
      // Always clear local tokens
      await storageService.delete('access_token');
      await storageService.delete('refresh_token');
    }
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    const refreshTokenResult = await storageService.get<string>('refresh_token');
    const refreshToken = refreshTokenResult.success ? refreshTokenResult.data : null;
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.post<{ accessToken: string }>('/auth/refresh', { refreshToken });

    // Update stored access token
    if (response.data.accessToken) {
      await storageService.set('accessToken', response.data.accessToken);
    }

    return response.data;
  }

  async getCurrentUser(): Promise<unknown> {
    const response = await this.get<unknown>('/auth/me');
    return response.data;
  }

  async isAuthenticated(): Promise<boolean> {
    const tokenResult = await storageService.get<string>(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
    return tokenResult.success && !!tokenResult.data;
  }

  async getAuthToken(): Promise<string | null> {
    const tokenResult = await storageService.get<string>(CLIENT_STORAGE_KEYS.AUTH_TOKEN);
    return tokenResult.success && tokenResult.data ? tokenResult.data : null;
  }

  // User methods
  async getUserProfile(): Promise<unknown> {
    const response = await this.get<unknown>('/users/profile');
    return response.data;
  }

  async updateUserProfile(data: UserProfileUpdateData): Promise<unknown> {
    // Validate required fields
    if (!data || Object.keys(data).length === 0) {
      throw new Error('Profile data is required');
    }

    const response = await this.put<unknown>('/users/profile', data as Record<string, BasicValue>);
    return response.data;
  }

  async getUserCredits(): Promise<unknown> {
    const response = await this.get<unknown>('/users/credits');
    return response.data;
  }

  async deductCredits(amount: number): Promise<unknown> {
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const response = await this.post<unknown>('/users/credits', { amount });
    return response.data;
  }

  // Game methods
  async saveGameHistory(data: CreateGameHistoryDto): Promise<void> {
    // Validate game history data
    if (!data || !data.userId || !data.score) {
      throw new Error('Game history data is incomplete');
    }

    const response = await this.post<void>('/game-history', data);
    return response.data;
  }

  async getUserGameHistory(limit?: number, offset?: number): Promise<unknown> {
    // Validate pagination parameters
    if (limit && (limit < 1 || limit > 1000)) {
      throw new Error('Limit must be between 1 and 1000');
    }
    if (offset && offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const response = await this.get<unknown>(`/game-history/user?${params}`);
    return response.data;
  }

  async getLeaderboardEntries(limit?: number): Promise<LeaderboardEntry[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await this.get<LeaderboardEntry[]>(`/leaderboard/global${params}`);
    return response.data;
  }

  async getUserRank(): Promise<UserRankData> {
    const response = await this.get<UserRankData>('/leaderboard/user/ranking');
    return response.data;
  }

  async getUserStats(): Promise<UserStatsData> {
    // Use analytics instead of separate stats endpoint
    const response = await this.get<CompleteUserAnalytics>('/analytics/user/');

    // Convert UserAnalytics to UserStatsData format
    const analytics = response.data;
    return {
      userId: analytics.basic.userId,
      totalQuestions: analytics.game.totalQuestions,
      totalCorrectAnswers: analytics.game.correctAnswers,
      successRate: analytics.game.successRate,
      totalGames: analytics.game.totalGames,
      averageScore: analytics.game.successRate,
      bestScore: 0,
      totalPlayTime: analytics.game.totalPlayTime || 0,
      favoriteTopic: '',
      currentStreak: 0,
      bestStreak: 0,
    };
  }

  async getUserPercentile(): Promise<{ percentile: number; rank: number; totalUsers: number }> {
    const response = await this.get<{ percentile: number; rank: number; totalUsers: number }>(
      '/leaderboard/user/percentile'
    );
    return response.data;
  }

  async getGameById(gameId: string): Promise<TriviaQuestion> {
    const response = await this.get<TriviaQuestion>(`/game/${gameId}`);
    return response.data;
  }

  // Points methods
  async getPointBalance(): Promise<PointBalance> {
    const response = await this.get<PointBalance>('/points/balance');
    return response.data;
  }

  async getPointPackages(): Promise<PointPurchaseOption[]> {
    const response = await this.get<PointPurchaseOption[]>('/points/packages');
    return response.data;
  }

  async canPlay(questionCount: number): Promise<CanPlayResponse> {
    // Validate question count
    if (questionCount <= 0) {
      throw new Error('Question count must be greater than 0');
    }

    const response = await this.get<CanPlayResponse>(
      `/points/can-play?questionCount=${questionCount}`
    );
    return response.data;
  }

  async getPointHistory(limit?: number): Promise<PointTransaction[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await this.get<PointTransaction[]>(`/points/history${params}`);
    return response.data;
  }

  async confirmPointPurchase(paymentIntentId: string): Promise<PointBalance> {
    const response = await this.post<PointBalance>('/points/confirm-purchase', { paymentIntentId });
    return response.data;
  }

  // Subscription methods
  async getSubscriptionPlans(): Promise<SubscriptionPlans> {
    const response = await this.get<SubscriptionPlans>('/subscription/plans');
    return response.data;
  }

  async getCurrentSubscription(): Promise<SubscriptionData> {
    const response = await this.get<SubscriptionData>('/subscription/current');
    return response.data;
  }

  async createSubscription(plan: string, billingCycle?: string): Promise<SubscriptionData> {
    const response = await this.post<SubscriptionData>('/subscription/create', {
      plan,
      billingCycle: billingCycle || '',
    });
    return response.data;
  }

  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    const response = await this.delete<{ success: boolean; message: string }>(
      '/subscription/cancel'
    );
    return response.data;
  }

  // Trivia methods
  async getTrivia(request: TriviaRequest): Promise<TriviaQuestion> {
    // Validate trivia request
    if (!request || !request.topic || !request.difficulty) {
      throw new Error('Trivia request is incomplete');
    }
    if (
      request.question_count &&
      (Number(request.question_count) < 1 || Number(request.question_count) > 50)
    ) {
      throw new Error('Question count must be between 1 and 50');
    }

    const response = await this.post<TriviaQuestion>('/game/trivia', request);
    return response.data;
  }

  async saveHistory(data: CreateGameHistoryDto): Promise<void> {
    const response = await this.post<void>('/game/history', data);
    return response.data;
  }

  async getLeaderboard(limit?: number): Promise<LeaderboardEntry[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await this.get<LeaderboardEntry[]>(`/leaderboard/global${params}`);
    return response.data;
  }

  async getUserScore(): Promise<number> {
    // Use leaderboard ranking to get user score
    const response = await this.get<UserRankData>(`/leaderboard/user/ranking`);
    return response.data?.score || 0;
  }

  async validateCustomDifficulty(customText: string): Promise<CustomDifficultyValidationResponse> {
    // Validate input
    if (!customText || customText.trim().length === 0) {
      throw new Error('Custom difficulty text is required');
    }
    if (customText.length > 500) {
      throw new Error('Custom difficulty text is too long (max 500 characters)');
    }

    const request: ValidateCustomDifficultyRequest = { customText };
    const response = await this.post<CustomDifficultyValidationResponse>(
      '/game/validate-custom',
      request
    );
    return response.data;
  }

  /**
   * Validate language and spelling
   */
  async validateLanguage(
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
    language: string;
    confidence: number;
  }> {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for language validation');
    }

    const response = await this.post<{
      isValid: boolean;
      errors: string[];
      suggestions: string[];
      language: string;
      confidence: number;
    }>('/game/validate-language', {
      text,
      ...options,
    });
    return response.data;
  }

  // User preferences methods
  async updateUserPreferences(preferences: UserPreferencesUpdate): Promise<void> {
    const response = await this.put<void>('/users/preferences', preferences);
    return response.data;
  }

  // User search methods
  async searchUsers(
    query: string,
    limit?: number
  ): Promise<{ query: string; results: User[]; totalResults: number }> {
    const response = await this.post<{ query: string; results: User[]; totalResults: number }>(
      '/users/search',
      { query, limit: limit || 0 }
    );
    return response.data;
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<unknown> {
    // Validate username
    if (!username || username.trim().length === 0) {
      throw new Error('Username is required');
    }

    const response = await this.get<unknown>(`/users/username/${encodeURIComponent(username)}`);
    return response.data;
  }

  // Account management methods
  async deleteUserAccount(): Promise<{ success: boolean; message: string }> {
    const response = await this.delete<{ success: boolean; message: string }>('/users/account');
    return response.data;
  }

  // AI Providers monitoring methods
  async getAiProviderStats(): Promise<{
    totalProviders: number;
    currentProviderIndex: number;
    providers: string[];
    providerDetails: Record<string, unknown>;
    timestamp: string;
  }> {
    const response = await this.get<{
      totalProviders: number;
      currentProviderIndex: number;
      providers: string[];
      providerDetails: Record<string, unknown>;
      timestamp: string;
    }>('/api/ai-providers/stats');
    return response.data;
  }

  async getAvailableProvidersCount(): Promise<{
    availableProviders: number;
    totalProviders: number;
    unavailableProviders: Array<{
      name: string;
      reason: string;
      lastChecked: string;
    }>;
    timestamp: string;
  }> {
    const response = await this.get<{
      availableProviders: number;
      totalProviders: number;
      unavailableProviders: Array<{
        name: string;
        reason: string;
        lastChecked: string;
      }>;
      timestamp: string;
    }>('/api/ai-providers/count');
    return response.data;
  }

  async getAiProvidersHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
    availableProviders?: number;
    totalProviders?: number;
    lastChecked?: string;
    issues?: Array<{
      provider: string;
      issue: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    error?: string;
    timestamp: string;
  }> {
    const response = await this.get<{
      status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
      availableProviders?: number;
      totalProviders?: number;
      lastChecked?: string;
      issues?: Array<{
        provider: string;
        issue: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
      }>;
      error?: string;
      timestamp: string;
    }>('/api/ai-providers/health');
    return response.data;
  }

  // Analytics dashboard methods
  async getUserAnalytics(): Promise<CompleteUserAnalytics> {
    const response = await this.get<CompleteUserAnalytics>('/analytics/user/');
    return response.data;
  }

  async getPopularTopics(query?: UserAnalyticsQuery): Promise<TopicStatsData> {
    const params = query
      ? `?${new URLSearchParams(query as Record<string, string>).toString()}`
      : '';
    const response = await this.get<TopicStatsData>(`/analytics/topics/popular${params}`);
    return response.data;
  }

  async getDifficultyStats(query?: UserAnalyticsQuery): Promise<DifficultyStatsData> {
    const params = query
      ? `?${new URLSearchParams(query as Record<string, string>).toString()}`
      : '';
    const response = await this.get<DifficultyStatsData>(`/analytics/difficulty/stats${params}`);
    return response.data;
  }

  /**
   * Get detailed game statistics
   */
  async getGameStats(query?: UserAnalyticsQuery): Promise<{
    totalGames: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
    totalTimeSpent: number;
    averageTimePerGame: number;
    correctAnswers: number;
    wrongAnswers: number;
    accuracy: number;
    topics: Array<{ topic: string; count: number; averageScore: number }>;
    difficulties: Array<{ difficulty: string; count: number; averageScore: number }>;
  }> {
    const params = query
      ? `?${new URLSearchParams(query as Record<string, string>).toString()}`
      : '';
    const response = await this.get<{
      totalGames: number;
      averageScore: number;
      bestScore: number;
      worstScore: number;
      totalTimeSpent: number;
      averageTimePerGame: number;
      correctAnswers: number;
      wrongAnswers: number;
      accuracy: number;
      topics: Array<{ topic: string; count: number; averageScore: number }>;
      difficulties: Array<{ difficulty: string; count: number; averageScore: number }>;
    }>(`/analytics/game/stats${params}`);
    return response.data;
  }

  // Leaderboard features methods
  async getUserRanking(): Promise<UserRankData> {
    const response = await this.get<UserRankData>('/leaderboard/user/ranking');
    return response.data;
  }

  async updateUserRanking(): Promise<{ success: boolean; message: string }> {
    const response = await this.post<{ success: boolean; message: string }>(
      '/leaderboard/user/update'
    );
    return response.data;
  }

  /**
   * Get leaderboard by time period
   */
  async getLeaderboardByPeriod(
    period: 'weekly' | 'monthly' | 'yearly',
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    // Validate period
    if (!['weekly', 'monthly', 'yearly'].includes(period)) {
      throw new Error('Period must be weekly, monthly, or yearly');
    }
    if (limit < 1 || limit > 1000) {
      throw new Error('Limit must be between 1 and 1000');
    }

    const response = await this.get<LeaderboardEntry[]>(
      `/leaderboard/period/${period}?limit=${limit}`
    );
    return response.data;
  }

  async getGlobalLeaderboard(
    limit: number = 100,
    offset: number = 0
  ): Promise<{
    leaderboard: LeaderboardEntry[];
    pagination: { total: number; limit: number; offset: number };
  }> {
    const response = await this.get<{
      leaderboard: LeaderboardEntry[];
      pagination: { total: number; limit: number; offset: number };
    }>(`/leaderboard/global?limit=${limit}&offset=${offset}`);
    return response.data;
  }

  // Points system methods

  /**
   * Get payment history
   */
  async getPaymentHistory(
    limit?: number,
    offset?: number
  ): Promise<{
    payments: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      description?: string;
      createdAt: string;
      updatedAt: string;
    }>;
    total: number;
    limit: number;
    offset: number;
  }> {
    // Validate pagination parameters
    if (limit && (limit < 1 || limit > 1000)) {
      throw new Error('Limit must be between 1 and 1000');
    }
    if (offset && offset < 0) {
      throw new Error('Offset cannot be negative');
    }

    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const queryString = params.toString();
    const url = queryString ? `/payment/history?${queryString}` : '/payment/history';

    const response = await this.get<{
      payments: Array<{
        id: string;
        amount: number;
        currency: string;
        status: string;
        description?: string;
        createdAt: string;
        updatedAt: string;
      }>;
      total: number;
      limit: number;
      offset: number;
    }>(url);
    return response.data;
  }

  // New endpoints for game history management
  async deleteGameHistory(gameId: string): Promise<{ success: boolean; message: string }> {
    // Validate game ID
    if (!gameId || gameId.trim().length === 0) {
      throw new Error('Game ID is required');
    }

    const response = await this.delete(`/game/history/${gameId}`);
    return response.data as { success: boolean; message: string };
  }

  async clearGameHistory(): Promise<{ success: boolean; message: string; deletedCount: number }> {
    const response = await this.delete('/game/history');
    return response.data as { success: boolean; message: string; deletedCount: number };
  }

  // New endpoints for user management
  async updateUserField(field: string, value: unknown): Promise<unknown> {
    // Validate field and value
    if (!field || field.trim().length === 0) {
      throw new Error('Field name is required');
    }
    if (value === undefined || value === null) {
      throw new Error('Value is required');
    }

    return this.put(`/users/profile/${field}`, { value: value as BasicValue });
  }

  async updateSinglePreference(preference: string, value: unknown): Promise<unknown> {
    // Validate preference and value
    if (!preference || preference.trim().length === 0) {
      throw new Error('Preference name is required');
    }
    if (value === undefined || value === null) {
      throw new Error('Value is required');
    }

    return this.put(`/users/preferences/${preference}`, { value: value as BasicValue });
  }

  async getUserById(userId: string): Promise<unknown> {
    // Validate user ID
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    return this.get(`/users/${userId}`);
  }

  async updateUserCredits(userId: string, amount: number, reason: string): Promise<unknown> {
    // Validate parameters
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }
    if (amount === 0) {
      throw new Error('Amount cannot be zero');
    }
    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required');
    }

    return this.put(`/users/credits/${userId}`, { amount, reason });
  }

  /**
   * Deduct points for game play
   */
  async deductPoints(questionCount: number, gameMode: string): Promise<PointBalance> {
    // Validate parameters
    if (questionCount <= 0) {
      throw new Error('Question count must be greater than 0');
    }
    if (!gameMode || gameMode.trim().length === 0) {
      throw new Error('Game mode is required');
    }

    const response = await this.post<PointBalance>('/points/deduct', { questionCount, gameMode });
    return response.data;
  }

  /**
   * Purchase points package
   */
  async purchasePoints(packageId: string): Promise<UrlResponse> {
    // Validate package ID
    if (!packageId || packageId.trim().length === 0) {
      throw new Error('Package ID is required');
    }

    const response = await this.post<UrlResponse>('/points/purchase', { packageId });
    return response.data;
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<unknown> {
    // Validate user ID
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    const response = await this.delete<unknown>(`/users/${userId}`);
    return response.data;
  }

  /**
   * Update user status
   */
  async updateUserStatus(
    userId: string,
    status: 'active' | 'suspended' | 'banned'
  ): Promise<unknown> {
    // Validate parameters
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }
    if (!['active', 'suspended', 'banned'].includes(status)) {
      throw new Error('Status must be active, suspended, or banned');
    }

    const response = await this.patch<unknown>(`/users/${userId}/status`, { status });
    return response.data;
  }
}

export const apiService = new ApiService();
