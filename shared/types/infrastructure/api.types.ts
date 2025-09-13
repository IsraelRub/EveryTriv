/**
 * API and HTTP type definitions for EveryTriv
 * Shared between client and server
 *
 * @module ApiTypes
 * @description API response structures and HTTP communication interfaces
 * @used_by client: client/src/services/api.service.ts (ApiService), server: server/src/controllers, shared: shared/services
 */
import type { ApiRequestBody } from '../core/data.types';
import type { BaseError , ErrorDetails } from '../core/error.types';
import type { BaseApiResponse, BasePagination , PaginatedResponse, SuccessResponse } from '../core/response.types';

/**
 * Standard API response wrapper interface
 * @interface ApiResponse
 * @description Generic wrapper for all API responses
 * @template T The type of the response data
 * @used_by server: server/src/features/game/game.controller.ts (getTrivia response), client: client/src/services/api.service.ts (ApiService methods), shared/services/http-client.ts (HttpClient responses))
 */
export interface ApiResponse<T = ApiRequestBody> extends BaseApiResponse<T> {
	/** Response metadata */
	metadata?: ApiMetadata;
}

/**
 * Simple success response interface
 * @interface SimpleSuccessResponse
 * @description Simple response with success status and optional data
 * @template T The type of the response data
 */
export interface SimpleSuccessResponse<T = ApiRequestBody> extends SuccessResponse<T> {
	// Inherits from SuccessResponse
}

/**
 * Payment response interface
 * @interface PaymentResponse
 * @description Response for payment operations
 */
export interface PaymentResponse {
	/** Success status */
	success: boolean;
	/** Payment URL for redirect */
	paymentUrl?: string;
	/** Payment ID */
	paymentId?: string;
	/** Error message */
	error?: string;
}

/**
 * Unified API metadata interface
 * @interface ApiMetadata
 * @description Additional metadata for API responses including pagination
 * @used_by server: server/src/features/game/game.controller.ts (pagination), client: client/src/services/api.service.ts (ApiService methods)
 */
export interface ApiMetadata extends Partial<BasePagination> {
	/** Response timestamp */
	timestamp?: string;
	/** Request processing time in milliseconds */
	processingTime?: number;
}

/**
 * Unified API error response interface
 * @interface ApiError
 * @description Standard error response structure
 * @used_by server: server/src/common/filters/http-exception.filter.ts (error responses), client: client/src/services/api.service.ts (error handling), shared/services/http-client.ts (error handling)
 */
export interface ApiError extends BaseError {
	/** Additional error details */
	details?: ErrorDetails;
	/** Request path that caused the error */
	path?: string;
}

/**
 * Legacy error response interface (deprecated - use ApiError instead)
 * @interface ErrorResponse
 * @description Alternative error response structure - kept for backward compatibility
 * @deprecated Use ApiError instead
 * @used_by server: server/src/common/filters/http-exception.filter.ts (error responses), client: client/src/services/api.service.ts (error handling)
 */

/**
 * HTTP status codes enum
 * @enum HttpStatusCode
 * @description Common HTTP status codes used in the application
 * @used_by server: server/src/common/filters/http-exception.filter.ts (error responses), client: client/src/services/api.service.ts (error handling)
 */

/**
 * Paginated response interface using unified metadata
 * @interface ApiPaginatedResponse
 * @description Standard structure for paginated API responses
 * @template T The type of items in the paginated response
 * @used_by server: server/src/features/gameHistory/gameHistory.controller.ts (getUserGameHistory), client: client/src/services/api.service.ts (getUserGameHistory)
 */
export interface ApiPaginatedResponse<T> extends PaginatedResponse<T> {
	// Inherits from PaginatedResponse
}

/**
 * Base DTO for amount-based operations
 * @interface AmountDto
 * @description Base interface for operations involving amounts
 */
export interface AmountDto {
	/** Amount to process */
	amount: number;
}

/**
 * DTO for deducting user credits
 * @interface DeductCreditsDto
 * @description Request payload for deducting credits from user account
 * @used_by client/src/services/api.service.ts (deductCredits), client/src/services/auth/user.service.ts (deductCredits)
 */
export type DeductCreditsDto = AmountDto;

/**
 * DTO for deducting user points (legacy - not used)
 * @interface DeductPointsDto
 * @description Request payload for point deduction operations
 * @deprecated Use DeductPointsRequest instead
 */
export interface DeductPointsDto extends AmountDto {
	/** Reason for point deduction */
	reason: string;
}

/**
 * Base DTO for purchase operations with unified identifier
 * @interface PurchaseDto
 * @description Base interface for purchase operations
 */
export interface PurchaseDto {
	/** Package or Plan identifier */
	identifier: string;
	/** Payment method identifier */
	paymentMethodId: string;
}

/**
 * DTO for purchasing points
 * @interface PurchasePointsDto
 * @description Request payload for point purchase operations
 * @used_by client/src/services/utils/points.service.ts (purchasePoints)
 */
export type PurchasePointsDto = PurchaseDto;

/**
 * DTO for purchasing packages
 * @interface PurchasePackageDto
 * @description Request payload for package purchase operations
 * @used_by client/src/services/utils/points.service.ts (purchasePoints)
 */
export type PurchasePackageDto = PurchaseDto;

/**
 * DTO for creating subscriptions
 * @interface CreateSubscriptionDto
 * @description Request payload for subscription creation
 * @used_by client/src/services/utils/points.service.ts (purchasePoints)
 */
export type CreateSubscriptionDto = PurchaseDto;

/**
 * DTO for confirming point purchase
 * @interface ConfirmPointPurchaseDto
 * @description Request payload for confirming point purchase
 * @used_by client/src/services/api.service.ts (confirmPointPurchase), client/src/services/utils/points.service.ts (confirmPointPurchase)
 */
export interface ConfirmPointPurchaseDto {
	/** Payment intent identifier */
	paymentIntentId: string;
}

/**
 * Can play response interface
 * @interface CanPlayResponse
 * @description Response for checking if user can play
 * @used_by client/src/services/api.service.ts (canPlay), client/src/services/utils/points.service.ts (canPlay)
 */
export interface CanPlayResponse {
	/** Whether the user can play */
	allowed: boolean;
	/** Reason if not allowed */
	reason?: string;
}

/**
 * Purchase response interface
 * @interface PurchaseResponse
 * @description Response for purchase operations
 * @used_by client/src/services/api.service.ts (purchasePointPackage), client/src/services/utils/points.service.ts (purchasePoints)
 */
export interface PurchaseResponse {
	/** Purchase status */
	status: string;
	/** Purchase identifier */
	id: string;
}

/**
 * Deduct points request interface
 * @interface DeductPointsRequest
 * @description Request payload for deducting points
 * @used_by client/src/services/api.service.ts (deductPoints), client/src/services/utils/points.service.ts (deductPoints)
 */
export interface DeductPointsRequest extends Record<string, unknown> {
	/** Number of questions */
	questionCount: number;
	/** Game mode */
	gameMode: string;
}

/**
 * Individual question data structure
 * @interface QuestionData
 * @description Represents a single question's data in game history
 */
export interface QuestionData {
	/** Question text */
	question: string;
	/** User's selected answer */
	userAnswer: string;
	/** Correct answer text */
	correctAnswer: string;
	/** Whether answer was correct */
	isCorrect: boolean;
	/** Time spent on question */
	timeSpent?: number;
}

/**
 * DTO for creating game history record
 * @interface CreateGameHistoryDto
 * @description Complete game session data for history storage
 * @used_by client/src/services/api.service.ts (saveHistory, saveGameHistory)
 */
export interface CreateGameHistoryDto {
	/** User identifier */
	userId: string;
	/** Final game score */
	score: number;
	/** Total questions in game */
	totalQuestions: number;
	/** Number of correct answers */
	correctAnswers: number;
	/** Game difficulty level */
	difficulty: string;
	/** Game topic */
	topic: string;
	/** Game mode used */
	gameMode: string;
	/** Total time spent in seconds */
	timeSpent: number;
	/** Credits consumed */
	creditsUsed: number;
	/** Detailed question data */
	questionsData: QuestionData[];
}

// User Profile Response
export interface UserProfileResponse {
	data: {
		id: string;
		username: string;
		email: string;
		firstName?: string;
		lastName?: string;
		role?: string;
		createdAt?: string;
		updatedAt?: string;
		preferences?: Record<string, unknown>;
	};
	timestamp: string;
}

// Admin User Data
export interface AdminUserData {
	id: string;
	username: string;
	email: string;
	role: string;
	createdAt: string;
	lastLogin?: string;
}

// Users List Response
export interface UsersListResponse {
	message: string;
	adminUser: AdminUserData;
	users: AdminUserData[];
	success: boolean;
	timestamp: string;
}

// Game Statistics Response
export interface GameStatisticsResponse {
	message: string;
	statistics: {
		totalGames: number;
		averageScore: number;
		bestScore: number;
		totalQuestionsAnswered: number;
		correctAnswers: number;
		accuracy: number;
		favoriteTopics: string[];
		difficultyBreakdown: Record<string, number>;
	};
	success: boolean;
	timestamp: string;
}
