/**
 * API Types for EveryTriv Client
 *
 * @module ApiTypes
 * @description API service interface and response types
 */
import type {
	AuthCredentials,
	AuthResponse,
	CreateGameHistoryDto,
	GenericDataValue,
	LeaderboardEntry,
	TriviaQuestion,
	TriviaRequest,
	UserProfileUpdateData,
} from 'everytriv-shared/types';
import type { ApiResponse } from 'everytriv-shared/types/api.types';
import type { LanguageValidationOptions, LanguageValidationResult } from 'everytriv-shared/types/language.types';

import type { PointBalance, PointPurchaseOption, PointTransaction } from './points.types';

export type { ApiError,ApiResponse } from 'everytriv-shared/types/api.types';

// Using shared types instead of duplicates

export interface ClientApiService {
	// HTTP methods
	get<T>(url: string, config?: RequestInit): Promise<ApiResponse<T>>;
	post<T>(url: string, data?: GenericDataValue, config?: RequestInit): Promise<ApiResponse<T>>;
	put<T>(url: string, data?: GenericDataValue, config?: RequestInit): Promise<ApiResponse<T>>;
	delete<T>(url: string, config?: RequestInit): Promise<ApiResponse<T>>;

	// Auth methods
	login(credentials: AuthCredentials): Promise<AuthResponse>;
	register(credentials: AuthCredentials): Promise<AuthResponse>;
	logout(): Promise<void>;
	refreshToken(): Promise<{ access_token: string }>;

	// User methods
	getCurrentUser(): Promise<unknown>;
	getUserProfile(): Promise<unknown>;
	updateUserProfile(data: UserProfileUpdateData): Promise<unknown>;
	getUserCredits(): Promise<unknown>;
	deductCredits(amount: number): Promise<unknown>;
	updateProfile(data: UserProfileUpdateData): Promise<unknown>;

	// Game history methods
	saveGameHistory(data: CreateGameHistoryDto): Promise<unknown>;
	getUserGameHistory(limit?: number, offset?: number): Promise<unknown>;

	// Leaderboard methods
	getLeaderboardEntries(limit?: number): Promise<LeaderboardEntry[]>;
	getUserRank(): Promise<unknown>;
	getUserStats(): Promise<unknown>;

	// Game methods
	getGameById(gameId: string): Promise<TriviaQuestion>;

	// Points methods
	getPointBalance(): Promise<PointBalance>;
	getPointPackages(): Promise<PointPurchaseOption[]>;
	canPlay(questionCount: number): Promise<{ allowed: boolean; reason?: string }>;
	deductPoints(questionCount: number, gameMode: string): Promise<PointBalance>;
	getPointHistory(limit?: number): Promise<PointTransaction[]>;
	purchasePointPackage(packageId: string): Promise<{ status: string; id: string }>;
	confirmPointPurchase(paymentIntentId: string): Promise<PointBalance>;

	// Trivia methods
	getTrivia(request: TriviaRequest): Promise<TriviaQuestion>;
	saveHistory(data: CreateGameHistoryDto): Promise<unknown>;

	// Stats methods
	getDifficultyStats(userId: string): Promise<Record<string, { correct: number; total: number }>>;
	getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
	getUserScore(userId: string): Promise<number>;

	// Validation methods
	validateCustomDifficulty(customText: string): Promise<{ isValid: boolean; errors?: string[] }>;
	validateLanguage(text: string, options: LanguageValidationOptions): Promise<LanguageValidationResult>;
}
