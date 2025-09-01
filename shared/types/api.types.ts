/**
 * API and HTTP type definitions for EveryTriv
 * Shared between client and server
 *
 * @module ApiTypes
 * @description API response structures and HTTP communication interfaces
 * @used_by client: client/src/services/api.service.ts (ApiService), server: server/src/controllers, shared: shared/services
 */
import { ApiRequestBody } from './data.types';
import { ErrorDetails } from './error.types';

/**
 * Standard API response wrapper interface
 * @interface ApiResponse
 * @description Generic wrapper for all API responses
 * @template T The type of the response data
 * @used_by server: server/src/features/game/game.controller.ts (getTrivia response), client: client/src/services/api.service.ts (ApiService methods), shared/services/http-client.ts (HttpClient responses))
 */
export interface ApiResponse<T = ApiRequestBody> {
	/** Response data */
	data: T;
	/** Response metadata */
	metadata?: ApiMetadata;
	/** Success status */
	success: boolean;
	/** Optional message */
	message?: string;
}

/**
 * Simple success response interface
 * @interface SuccessResponse
 * @description Simple response with success status and optional data
 * @template T The type of the response data
 */
export interface SuccessResponse<T = ApiRequestBody> {
	/** Success status */
	success: boolean;
	/** Response data */
	data?: T;
	/** Optional message */
	message?: string;
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
export interface ApiMetadata {
	/** Total count for paginated responses */
	total?: number;
	/** Current page for paginated responses */
	page?: number;
	/** Items per page for paginated responses */
	limit?: number;
	/** Total number of pages (calculated) */
	totalPages?: number;
	/** Whether there are more pages */
	hasNext?: boolean;
	/** Whether there are previous pages */
	hasPrev?: boolean;
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
export interface ApiError {
	/** Error message */
	message: string;
	/** Error code */
	code?: string;
	/** HTTP status code */
	statusCode: number;
	/** Additional error details */
	details?: ErrorDetails;
	/** Error timestamp */
	timestamp?: string;
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
export interface ErrorResponse {
	/** Error status */
	status: number;
	/** Error message */
	message: string;
	/** Error details */
	error?: ErrorDetails;
}

/**
 * HTTP status codes enum
 * @enum HttpStatusCode
 * @description Common HTTP status codes used in the application
 * @used_by server: server/src/common/filters/http-exception.filter.ts (error responses), client: client/src/services/api.service.ts (error handling)
 */
export enum HttpStatusCode {
	OK = 200,
	CREATED = 201,
	NO_CONTENT = 204,
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	CONFLICT = 409,
	UNPROCESSABLE_ENTITY = 422,
	INTERNAL_SERVER_ERROR = 500,
	BAD_GATEWAY = 502,
	SERVICE_UNAVAILABLE = 503,
}

/**
 * Paginated response interface using unified metadata
 * @interface PaginatedResponse
 * @description Standard structure for paginated API responses
 * @template T The type of items in the paginated response
 * @used_by server: server/src/features/gameHistory/gameHistory.controller.ts (getUserGameHistory), client: client/src/services/api.service.ts (getUserGameHistory)
 */
export interface PaginatedResponse<T> {
	/** Array of items */
	items: T[];
	/** Pagination metadata */
	pagination: Required<Pick<ApiMetadata, 'page' | 'limit' | 'total' | 'totalPages' | 'hasNext' | 'hasPrev'>>;
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
export interface CreateGameHistoryDto extends Record<string, unknown> {
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
