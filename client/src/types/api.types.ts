/**
 * API Types for EveryTriv Client
 *
 * @module ClientApiTypes
 * @description Client-specific API service interface and response types
 */
import { BillingCycle, GameMode, PaymentMethod, PlanType, type TimePeriod } from '@shared/constants';
import type {
	Achievement,
	ActivityEntry,
	AnalyticsResponse,
	AnswerResult,
	ApiResponse,
	AuthCredentials,
	AuthenticationResult,
	BaseValidationResult,
	BasicUser,
	BasicValue,
	CanPlayResponse,
	ClientLogsRequest,
	CompleteUserAnalytics,
	CreditBalance,
	CreditPurchaseOption,
	CreditTransaction,
	DifficultyStatsData,
	GameData,
	GameHistoryEntry,
	LeaderboardEntry,
	PaymentResult,
	RequestData,
	SubscriptionData,
	SubscriptionPlans,
	SystemRecommendation,
	TopicStatsData,
	TriviaQuestion,
	TriviaRequest,
	TriviaResponse,
	UpdateUserProfileData,
	UserAnalyticsQuery,
	UserAnalyticsRecord,
	UserComparisonResult,
	UserInsightsData,
	UserPerformanceMetrics,
	UserPreferences,
	UserProfileResponseType,
	UserProgressAnalytics,
	UserRankData,
	UserStatsData,
	UserSummaryData,
	UserTrendPoint,
} from '@shared/types';

import type { EnhancedRequestConfig } from './interceptors.types';

/**
 * Trend query parameters
 * @interface TrendQueryParams
 * @description Parameters for trend analytics queries
 */
export interface TrendQueryParams {
	startDate?: string;
	endDate?: string;
	groupBy?: TimePeriod;
	limit?: number;
}

/**
 * Activity query parameters
 * @interface ActivityQueryParams
 * @description Parameters for activity analytics queries
 */
export interface ActivityQueryParams {
	startDate?: string;
	endDate?: string;
	limit?: number;
}

/**
 * Comparison query parameters
 * @interface ComparisonQueryParams
 * @description Parameters for comparison analytics queries
 */
export interface ComparisonQueryParams {
	target?: 'global' | 'user';
	targetUserId?: string;
	startDate?: string;
	endDate?: string;
}

export interface SubscriptionCreationResponse {
	subscriptionId?: string | null;
	planType?: PlanType;
	billingCycle?: BillingCycle;
	status?: string;
	paymentId?: string;
}

export interface ManualPaymentPayload {
	cardNumber: string;
	expiryMonth: number;
	expiryYear: number;
	cvv: string;
	cardHolderName: string;
	postalCode?: string;
	expiryDate?: string;
}

export interface CreditsPurchaseRequest {
	packageId: string;
	paymentMethod: PaymentMethod;
	paypalOrderId?: string;
	paypalPaymentId?: string;
	manualPayment?: ManualPaymentPayload;
}

export interface CreditsPurchaseResponse extends PaymentResult {
	balance?: CreditBalance;
}

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
	searchUsers(query: string, limit?: number): Promise<BasicUser[]>;

	// Game history methods
	saveGameHistory(data: GameData): Promise<void>;
	getUserGameHistory(limit?: number, offset?: number): Promise<GameHistoryEntry[]>;

	// Leaderboard methods
	getLeaderboardEntries(limit?: number): Promise<LeaderboardEntry[]>;
	getUserRank(): Promise<UserRankData>;
	getUserStats(): Promise<UserStatsData>;
	updateUserRanking(): Promise<UserRankData>;
	getLeaderboardByPeriod(period: 'weekly' | 'monthly', limit?: number, offset?: number): Promise<LeaderboardEntry[]>;

	// Credits methods
	getCreditBalance(): Promise<CreditBalance>;
	getCreditPackages(): Promise<CreditPurchaseOption[]>;
	canPlay(questionsPerRequest: number): Promise<CanPlayResponse>;
	deductCredits(questionsPerRequest: number, gameMode: GameMode): Promise<CreditBalance>;
	getCreditHistory(limit?: number): Promise<CreditTransaction[]>;
	confirmCreditPurchase(paymentIntentId: string): Promise<CreditBalance>;

	// Trivia methods
	getTrivia(request: TriviaRequest): Promise<TriviaResponse>;
	submitAnswer(questionId: string, answer: string, timeSpent?: number): Promise<AnswerResult>;
	getTriviaQuestionById(questionId: string): Promise<TriviaQuestion>;
	getGameById(gameId: string): Promise<GameHistoryEntry>;

	// Validation methods
	validateCustomDifficulty(customText: string): Promise<BaseValidationResult>;

	// User preferences methods
	updateUserPreferences(preferences: Partial<UserPreferences>): Promise<void>;

	// Account management methods
	deleteUserAccount(): Promise<{ success: boolean; message: string }>;

	// Analytics dashboard methods
	getUserAnalytics(): Promise<CompleteUserAnalytics>;
	getPopularTopics(query?: UserAnalyticsQuery): Promise<TopicStatsData>;
	getDifficultyStats(query?: UserAnalyticsQuery): Promise<DifficultyStatsData>;
	trackAnalyticsEvent(eventData: {
		eventType: string;
		userId?: string;
		sessionId?: string;
		timestamp?: Date | string;
		page?: string;
		action?: string;
		result?: 'success' | 'failure' | 'error';
		duration?: number;
		value?: number;
		properties?: Record<string, BasicValue>;
	}): Promise<{ tracked: boolean }>;

	// Admin analytics methods (Admin only)
	getUserStatisticsById(userId: string): Promise<AnalyticsResponse<UserAnalyticsRecord>>;
	getUserPerformanceById(userId: string): Promise<AnalyticsResponse<UserPerformanceMetrics>>;
	getUserProgressById(
		userId: string,
		params?: { startDate?: string; endDate?: string; groupBy?: string; limit?: number }
	): Promise<AnalyticsResponse<UserProgressAnalytics>>;
	getUserActivityById(
		userId: string,
		params?: { startDate?: string; endDate?: string; limit?: number }
	): Promise<AnalyticsResponse<ActivityEntry[]>>;
	getUserInsightsById(userId: string): Promise<AnalyticsResponse<UserInsightsData>>;
	getUserRecommendationsById(userId: string): Promise<AnalyticsResponse<SystemRecommendation[]>>;
	getUserAchievementsById(userId: string): Promise<AnalyticsResponse<Achievement[]>>;
	getUserTrendsById(
		userId: string,
		params?: { startDate?: string; endDate?: string; groupBy?: string; limit?: number }
	): Promise<AnalyticsResponse<UserTrendPoint[]>>;
	compareUserPerformanceById(
		userId: string,
		params?: { target?: 'global' | 'user'; targetUserId?: string; startDate?: string; endDate?: string }
	): Promise<AnalyticsResponse<UserComparisonResult>>;
	getUserSummaryById(userId: string, includeActivity?: boolean): Promise<AnalyticsResponse<UserSummaryData>>;

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
	purchaseCredits(request: CreditsPurchaseRequest): Promise<CreditsPurchaseResponse>;

	// Subscription management methods
	createSubscription(plan: PlanType, billingCycle?: BillingCycle): Promise<SubscriptionData>;
	cancelSubscription(): Promise<{ success: boolean; message: string }>;
	getSubscriptionPlans(): Promise<SubscriptionPlans>;
	getCurrentSubscription(): Promise<SubscriptionData | null>;

	// Payment methods
	createPayment(paymentData: {
		amount?: number;
		currency?: string;
		description?: string;
		planType?: PlanType;
		numberOfPayments?: number;
		paymentMethod: string;
		cardNumber?: string;
		expiryDate?: string;
		cvv?: string;
		cardHolderName?: string;
		postalCode?: string;
		paypalOrderId?: string;
		paypalPaymentId?: string;
		agreeToTerms?: boolean;
		additionalInfo?: string;
	}): Promise<PaymentResult>;
	getPaymentHistory(): Promise<PaymentResult[]>;

	// Client logs methods
	submitClientLogs(logs: ClientLogsRequest): Promise<{ success: boolean; message?: string }>;
}
