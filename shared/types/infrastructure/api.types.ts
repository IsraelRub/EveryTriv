/**
 * API and HTTP type definitions for EveryTriv
 * Shared between client and server
 *
 * @module ApiTypes
 * @description API response structures and HTTP communication interfaces
 * @used_by client: client/src/services/api.service.ts (ApiService), server: server/src/controllers, shared: shared/services
 */
import { GameMode } from '../../constants';
import type { BaseApiResponse, BaseData, BasePagination } from '../core';
import type { BasicUser, GameDifficulty, MiddlewareMetrics } from '../domain';

/**
 * Standard API response wrapper interface
 * @interface ApiResponse
 * @description Generic wrapper for all API responses with optional metadata
 * Use SuccessResponse<T> for simple success responses without metadata
 * Use ApiResponse<T> for responses that may include metadata (pagination, processing time, etc.)
 * @template T The type of the response data
 * @used_by server: server/src/features/game/game.controller.ts (getTrivia response), client: client/src/services/api.service.ts (ApiService methods), shared/services/logging (HttpClient responses))
 */
export interface ApiResponse<T = BaseData> extends BaseApiResponse<T> {
	metadata?: ApiMetadata;
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
}

/**
 * Error response data interface
 * @interface ErrorResponseData
 * @description Error data structure from API error responses
 * @used_by client/src/services/api.service.ts
 */
export interface ErrorResponseData {
	message?: string;
	error?: string;
}

/**
 * HTTP status codes enum
 * @enum HttpStatusCode
 * @description Common HTTP status codes used in the application
 * @used_by server: server/src/common/filters/http-exception.filter.ts (error responses), client: client/src/services/api.service.ts (error handling)
 */

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
export interface DeductPointsRequest {
	questionCount: number;
	gameMode: GameMode;
}

/**
 * Individual question data structure
 * @interface QuestionData
 * @description Represents a single question's data in game history
 */
export interface QuestionData {
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
export interface GameData {
	userId: string;
	score: number;
	totalQuestions: number;
	correctAnswers: number;
	difficulty: GameDifficulty;
	topic: string;
	gameMode: GameMode;
	timeSpent: number;
	creditsUsed: number;
	questionsData: QuestionData[];
}

// Admin User Data
export interface AdminUserData extends BasicUser {
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
	metrics: Record<string, MiddlewareMetrics> | MiddlewareMetrics;
	storageMetrics: unknown;
}

// Middleware Metrics Response
export type MiddlewareMetricsResponse = MiddlewareMetrics | Record<string, MiddlewareMetrics>;
