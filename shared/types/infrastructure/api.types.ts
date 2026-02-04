// API and HTTP type definitions for EveryTriv.
import { GameMode } from '../../constants';
import type { BaseApiResponse, BaseData, OffsetPagination, PagePagination } from '../core';
import type { BasicUser, GameDifficulty, MiddlewareMetrics } from '../domain';

export interface ApiResponse<T = BaseData> extends BaseApiResponse<T> {
	metadata?: ApiMetadata;
}

export interface PaymentResponse {
	success: boolean;
	paymentUrl?: string;
	paymentId?: string;
	error?: string;
}

export interface ApiMetadata extends Partial<PagePagination> {
	timestamp?: string;
	processingTime?: number;
}

export interface ApiError {
	message: string;
	code?: string;
	statusCode: number;
	timestamp?: string;
	details?: BaseData;
}

export type ErrorDetail = string | string[] | Record<string, string | string[]>;

export interface ErrorResponseData {
	message?: string;
	error?: string;
	detail?: string;
	description?: string;
	errors?: ErrorDetail;
	code?: string;
}

export interface ErrorResponse {
	statusCode: number;
	path: string;
	message: string | string[];
	timestamp: string;
	errorType?: string;
	code?: string;
}

export interface ValidationErrorResponse extends ErrorResponse {
	errors?: string[] | Record<string, string | string[]>;
}

export interface AmountDto {
	amount: number;
}

export interface PurchaseDto {
	identifier: string;
	paymentMethodId: string;
}

export interface ConfirmCreditPurchaseDto {
	paymentIntentId: string;
}

export interface DeductCreditsRequest {
	questionsPerRequest: number;
	gameMode: GameMode;
}

export interface AnswerHistoryComplete {
	question: string;
	isCorrect: boolean;
	timeSpent: number;
	questionId: string;
	userAnswerIndex: number;
	correctAnswerIndex: number;
}

export interface AnswerHistoryFallback {
	question: string;
	isCorrect: boolean;
	timeSpent: number;
	userAnswerText: string;
	correctAnswerText: string;
}

export type AnswerHistory = AnswerHistoryComplete | AnswerHistoryFallback;

export interface GameData {
	userId: string;
	score: number;
	gameQuestionCount: number;
	correctAnswers: number;
	difficulty: GameDifficulty;
	topic: string;
	gameMode: GameMode;
	timeSpent: number;
	creditsUsed: number;
	answerHistory: AnswerHistory[];
	clientMutationId?: string;
}

export interface AdminUserData extends BasicUser {
	createdAt: string;
	lastLogin?: string;
}

export interface UsersListResponse {
	message: string;
	adminUser: AdminUserData;
	users: AdminUserData[];
	success: boolean;
	timestamp: string;
	pagination?: OffsetPagination;
}

export interface AdminUsersListResponse extends OffsetPagination {
	users: AdminUserData[];
}

export interface UpdateUserFieldResponse {
	success: boolean;
	message: string;
	field: string;
	value: unknown;
}

export interface RefreshTokenResponse {
	accessToken: string;
	refreshToken?: string;
	expiresIn?: number;
}

export interface MiddlewareMetricsSummary {
	totalMiddlewares: number;
	totalRequests: number;
	averagePerformance: number;
	slowestMiddleware: string;
	mostUsedMiddleware: string;
}

export interface AllMetricsResponse {
	summary: MiddlewareMetricsSummary;
	metrics: Record<string, MiddlewareMetrics> | MiddlewareMetrics;
	storageMetrics: unknown;
}

export type MetricsResponse = MiddlewareMetrics | Record<string, MiddlewareMetrics>;
