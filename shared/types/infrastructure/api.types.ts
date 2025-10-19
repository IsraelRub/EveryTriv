/**
 * API and HTTP type definitions for EveryTriv
 * Shared between client and server
 *
 * @module ApiTypes
 * @description API response structures and HTTP communication interfaces
 * @used_by client: client/src/services/api.service.ts (ApiService), server: server/src/controllers, shared: shared/services
 */
import type { BaseData } from '../core/data.types';
import type { BaseApiResponse, BasePagination, PaginatedResponse, SuccessResponse } from '../core/response.types';
// Import MiddlewareMetrics from metrics types
import type { MiddlewareMetrics } from '../domain/analytics/metrics.types';

/**
 * Standard API response wrapper interface
 * @interface ApiResponse
 * @description Generic wrapper for all API responses
 * @template T The type of the response data
 * @used_by server: server/src/features/game/game.controller.ts (getTrivia response), client: client/src/services/api.service.ts (ApiService methods), shared/services/logging (HttpClient responses))
 */
export interface ApiResponse<T = BaseData> extends BaseApiResponse<T> {
	metadata?: ApiMetadata;
}

/**
 * Simple success response interface
 * @interface SimpleSuccessResponse
 * @description Simple response with success status and optional data
 * @template T The type of the response data
 */
export interface SimpleSuccessResponse<T = BaseData> extends SuccessResponse<T> {
	// Inherits from SuccessResponse
}

/**
 * Payment response interface
 * @interface PaymentResponse
 * @description Response for payment operations
 */
export interface PaymentResponse {
	success: boolean;
	paymentUrl?: string;
	paymentId?: string;
	error?: string;
}

/**
 * API metadata interface
 * @interface ApiMetadata
 * @description Additional metadata for API responses including pagination
 * @used_by server: server/src/features/game/game.controller.ts (pagination), client: client/src/services/api.service.ts (ApiService methods)
 */
export interface ApiMetadata extends Partial<BasePagination> {
	timestamp?: string;
	processingTime?: number;
}

/**
 * API error response interface
 * @interface ApiError
 * @description Standard error response structure
 * @used_by server: server/src/common/globalException.filter.ts (error responses), client: client/src/services/api.service.ts (error handling), shared/services/logging (error handling)
 */
export interface ApiError {
	message: string;
	code?: string;
	statusCode: number;
	timestamp?: string;
	details?: BaseData;
	path?: string;
}

/**
 * HTTP status codes enum
 * @enum HttpStatusCode
 * @description Common HTTP status codes used in the application
 * @used_by server: server/src/common/filters/http-exception.filter.ts (error responses), client: client/src/services/api.service.ts (error handling)
 */

/**
 * Paginated response interface using metadata
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
	amount: number;
}


/**
 * Base DTO for purchase operations with identifier
 * @interface PurchaseDto
 * @description Base interface for purchase operations
 */
export interface PurchaseDto {
	identifier: string;
	paymentMethodId: string;
}


/**
 * DTO for confirming point purchase
 * @interface ConfirmPointPurchaseDto
 * @description Request payload for confirming point purchase
 * @used_by client/src/services/api.service.ts (confirmPointPurchase), client/src/services/utils/points.service.ts (confirmPointPurchase)
 */
export interface ConfirmPointPurchaseDto {
	paymentIntentId: string;
}

/**
 * Can play response interface
 * @interface CanPlayResponse
 * @description Response for checking if user can play
 * @used_by client/src/services/api.service.ts (canPlay), client/src/services/utils/points.service.ts (canPlay)
 */
export interface CanPlayResponse {
	allowed: boolean;
	reason?: string;
}

/**
 * Purchase response interface
 * @interface PurchaseResponse
 * @description Response for purchase operations
 * @used_by client/src/services/api.service.ts (purchasePointPackage), client/src/services/utils/points.service.ts (purchasePoints)
 */
export interface PurchaseResponse {
	status: string;
	id: string;
}

/**
 * Deduct points request interface
 * @interface DeductPointsRequest
 * @description Request payload for deducting points
 * @used_by client/src/services/api.service.ts (deductPoints), client/src/services/utils/points.service.ts (deductPoints)
 */
export interface DeductPointsRequest extends Record<string, unknown> {
	questionCount: number;
	gameMode: string;
}

/**
 * Individual question data structure
 * @interface QuestionData
 * @description Represents a single question's data in game history
 */
export interface ApiQuestionData {
	question: string;
	userAnswer: string;
	correctAnswer: string;
	isCorrect: boolean;
	timeSpent?: number;
}

/**
 * DTO for creating game history record
 * @interface CreateGameHistoryDto
 * @description Complete game session data for history storage
 * @used_by client/src/services/api.service.ts (saveHistory, saveGameHistory)
 */
export interface CreateGameHistoryDto {
	userId: string;
	score: number;
	totalQuestions: number;
	correctAnswers: number;
	difficulty: string;
	topic: string;
	gameMode: string;
	timeSpent: number;
	creditsUsed: number;
	questionsData: ApiQuestionData[];
}

import { UserRole } from '../../constants/business/info.constants';

// Admin User Data
export interface AdminUserData {
	id: string;
	username: string;
	email: string;
	role: UserRole;
	createdAt: string;
	lastLogin?: string;
}

// User Profile Response
export interface UserProfileResponse {
	data: Pick<AdminUserData, 'id' | 'username' | 'email' | 'role' | 'createdAt'> & {
		firstName?: string;
		lastName?: string;
		updatedAt?: string;
		preferences?: Record<string, unknown>;
	};
	timestamp: string;
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

// Middleware Metrics Summary
export interface MiddlewareMetricsSummary {
	totalMiddlewares: number;
	totalRequests: number;
	averagePerformance: number;
	slowestMiddleware: string;
	mostUsedMiddleware: string;
}

// All Middleware Metrics Response
export interface AllMiddlewareMetricsResponse {
	summary: MiddlewareMetricsSummary;
	metrics: Record<string, unknown> | unknown;
	storageMetrics: unknown;
}

// Middleware Metrics Response
export type MiddlewareMetricsResponse = MiddlewareMetrics | Record<string, MiddlewareMetrics>;
