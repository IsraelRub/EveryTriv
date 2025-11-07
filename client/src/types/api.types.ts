/**
 * API Types for EveryTriv Client
 *
 * @module ClientApiTypes
 * @description Client-specific API service interface and response types
 */
import { BillingCycle, GameMode, PlanType } from '@shared/constants';
import type {
	ApiResponse,
	AuthCredentials,
	AuthenticationResult,
	BasicUser,
	BasicValue,
	CanPlayResponse,
	CompleteUserAnalytics,
	DifficultyStatsData,
	GameData,
	GameHistoryEntry,
	LanguageValidationOptions,
	LanguageValidationResult,
	LeaderboardEntry,
	PointBalance,
	PointPurchaseOption,
	PointTransaction,
	RequestData,
	SimpleValidationResult,
	SubscriptionData,
	TopicStatsData,
	TriviaQuestion,
	TriviaRequest,
	UpdateUserProfileData,
	UrlResponse,
	UserAnalyticsQuery,
	UserPreferences,
	UserProfileResponseType,
	UserRankData,
	UserStatsData,
} from '@shared/types';

import type { EnhancedRequestConfig } from './interceptors.types';

export interface ClientApiService {
	// HTTP methods
	get<T>(url: string, config?: EnhancedRequestConfig): Promise<ApiResponse<T>>;
	post<T>(url: string, data?: RequestData, config?: EnhancedRequestConfig): Promise<ApiResponse<T>>;
	put<T>(url: string, data?: RequestData, config?: EnhancedRequestConfig): Promise<ApiResponse<T>>;
	delete<T>(url: string, config?: EnhancedRequestConfig): Promise<ApiResponse<T>>;

	// Auth methods
	login(credentials: AuthCredentials): Promise<AuthenticationResult>;
	register(credentials: AuthCredentials): Promise<AuthenticationResult>;
	logout(): Promise<void>;
	refreshToken(): Promise<{ accessToken: string }>;

	// User methods
	getCurrentUser(): Promise<BasicUser>;
	getUserProfile(): Promise<UserProfileResponseType>;
	updateUserProfile(data: UpdateUserProfileData): Promise<UserProfileResponseType>;
	getUserCredits(): Promise<number>;
	deductCredits(amount: number): Promise<{ success: boolean; credits: number }>;

	// Game history methods
	saveGameHistory(data: GameData): Promise<void>;
	getUserGameHistory(limit?: number, offset?: number): Promise<GameHistoryEntry[]>;

	// Leaderboard methods
	getLeaderboardEntries(limit?: number): Promise<LeaderboardEntry[]>;
	getUserRank(): Promise<UserRankData>;
	getUserStats(): Promise<UserStatsData>;

	// Points methods
	getPointBalance(): Promise<PointBalance>;
	getPointPackages(): Promise<PointPurchaseOption[]>;
	canPlay(questionCount: number): Promise<CanPlayResponse>;
	deductPoints(questionCount: number, gameMode: GameMode): Promise<PointBalance>;
	getPointHistory(limit?: number): Promise<PointTransaction[]>;
	confirmPointPurchase(paymentIntentId: string): Promise<PointBalance>;

	// Trivia methods
	getTrivia(request: TriviaRequest): Promise<TriviaQuestion>;

	// Validation methods
	validateCustomDifficulty(customText: string): Promise<SimpleValidationResult>;
	validateLanguage(text: string, options?: LanguageValidationOptions): Promise<LanguageValidationResult>;

	// User preferences methods
	updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void>;

	// Account management methods
	deleteUserAccount(): Promise<{ success: boolean; message: string }>;

	// Analytics dashboard methods
	getUserAnalytics(): Promise<CompleteUserAnalytics>;
	getPopularTopics(query?: UserAnalyticsQuery): Promise<TopicStatsData>;
	getDifficultyStats(query?: UserAnalyticsQuery): Promise<DifficultyStatsData>;

	// New game history management methods
	deleteGameHistory(gameId: string): Promise<{ success: boolean; message: string }>;
	clearGameHistory(): Promise<{ success: boolean; message: string; deletedCount: number }>;

	// New user management methods
	updateUserField(field: string, value: BasicValue): Promise<unknown>;
	updateSinglePreference(preference: string, value: BasicValue): Promise<unknown>;
	getUserById(userId: string): Promise<unknown>;
	updateUserCredits(userId: string, amount: number, reason: string): Promise<unknown>;
	deleteUser(userId: string): Promise<unknown>;
	updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned'): Promise<unknown>;
	purchasePoints(packageId: string): Promise<UrlResponse>;

	// Subscription management methods
	createSubscription(plan: PlanType, billingCycle?: BillingCycle): Promise<SubscriptionData>;
	cancelSubscription(): Promise<{ success: boolean; message: string }>;
}
