// API and HTTP type definitions for EveryTriv.
import { GameMode } from '../../constants';
import type { BaseApiResponse, BaseData, OffsetPagination, PagePagination } from '../core';
import type { BasicUser, GameDifficulty, MiddlewareMetrics } from '../domain';

export interface ApiResponse<T = BaseData> extends BaseApiResponse<T> {
	metadata?: ApiMetadata;
}

export interface ApiMetadata extends Partial<PagePagination> {
	timestamp?: string;
	processingTime?: number;
}

export type ErrorDetail = string | string[] | Record<string, string | string[]>;

export interface ErrorCodeField {
	code?: string;
}

export interface ApiError extends ErrorCodeField {
	message: string;
	statusCode: number;
	timestamp?: string;
	details?: BaseData;
}

export interface ErrorResponseData {
	message?: string;
	code?: string;
	error?: string;
	detail?: string;
	description?: string;
	errors?: ErrorDetail;
}

export interface ErrorResponse extends ErrorCodeField {
	message: string | string[];
	statusCode: number;
	path: string;
	timestamp: string;
	errorType?: string;
}

export type ValidationErrorResponse = ErrorResponse & { errors?: ErrorDetail };

export interface AnswerHistoryBase {
	question: string;
	isCorrect: boolean;
	timeSpent: number;
}

export interface AnswerHistoryComplete extends AnswerHistoryBase {
	questionId: string;
	userAnswerIndex: number;
	correctAnswerIndex: number;
}

export interface AnswerHistoryFallback extends AnswerHistoryBase {
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
