// API and HTTP type definitions for EveryTriv.
import { GameMode } from '../../constants';
import type { BaseApiResponse, BaseData, OffsetPagination, PagePagination } from '../core';
import type { BasicUser, GameDifficulty, MiddlewareMetrics } from '../domain';
import type { BaseAnswerData } from '../domain/game/trivia.types';

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

export interface PurchaseResponse {
	status: string;
	id: string;
}

export interface DeductCreditsRequest {
	questionsPerRequest: number;
	gameMode: GameMode;
}

export interface QuestionDataWithQuestion extends BaseAnswerData {
	question: string;
	correctAnswerIndex: number;
	timeSpent: number;
}

export interface QuestionDataWithoutQuestion {
	question: string;
	isCorrect: boolean;
	userAnswerText: string;
	correctAnswerText: string;
	timeSpent?: number;
}

export type QuestionData = QuestionDataWithQuestion | QuestionDataWithoutQuestion;

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
	questionsData: QuestionData[];
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
