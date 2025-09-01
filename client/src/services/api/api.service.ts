/**
 * Client API service
 * Handles HTTP requests to the server and returns typed DTOs
 * @module ClientApiService
 * @used_by client/src/hooks/api/**, client/src/views/**
 */
import {
	ApiError,
	ApiResponse,
	AuthCredentials,
	AuthResponse,
	CanPlayResponse,
	CreateGameHistoryDto,
	DeductPointsRequest,
	DifficultyStats,
	GenericDataValue,
	LeaderboardEntry,
	PointPurchaseOption,
	PurchaseResponse,
	TriviaQuestion,
	TriviaRequest,
	UserRank,
	UserStats,
} from 'everytriv-shared/types';
import type { LanguageValidationOptions, LanguageValidationResult } from 'everytriv-shared/types/language.types';
import { ValidateLanguageRequest } from 'everytriv-shared/types/language.types';
import { UserProfileUpdateData } from 'everytriv-shared/types/user.types';
import {
	CustomDifficultyValidationResponse,
	ValidateCustomDifficultyRequest,
} from 'everytriv-shared/types/validation.types';

import { API_BASE_URL, HTTP_CLIENT_CONFIG, HTTP_STATUS_CODES } from '../../constants';
import type { ClientApiService } from '../../types';
import { PointBalance, PointTransaction } from '../../types';

class ApiService implements ClientApiService {
	private baseURL: string;

	constructor() {
		this.baseURL = import.meta.env.VITE_API_URL || API_BASE_URL;
	}

	private getAuthHeaders(): Record<string, string> {
		const token = localStorage.getItem('access_token');
		return token ? { Authorization: `Bearer ${token}` } : {};
	}

	private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));

			// Use HTTP_STATUS_CODES for better error handling
			const isServerError =
				response.status >= HTTP_STATUS_CODES.SERVER_ERROR_MIN && response.status <= HTTP_STATUS_CODES.SERVER_ERROR_MAX;
			const isClientError =
				response.status >= HTTP_STATUS_CODES.BAD_REQUEST && response.status < HTTP_STATUS_CODES.SERVER_ERROR_MIN;

			throw {
				message: errorData.message || `HTTP ${response.status}`,
				statusCode: response.status,
				details: errorData,
				isServerError,
				isClientError,
			} as ApiError;
		}

		const data = await response.json();
		return {
			data,
			success: true,
		} as ApiResponse<T>;
	}

	private async handleError(error: unknown): Promise<never> {
		if (error instanceof TypeError) {
			throw {
				message: 'Network error occurred. Please check your connection.',
				statusCode: 0,
				details: (error as Error).message,
			} as ApiError;
		}
		throw error as ApiError;
	}

	async get<T>(url: string, config?: RequestInit): Promise<ApiResponse<T>> {
		try {
			const response = await fetch(`${this.baseURL}${url}`, {
				method: 'GET',
				headers: {
					...HTTP_CLIENT_CONFIG.DEFAULT_HEADERS,
					...this.getAuthHeaders(),
					...config?.headers,
				},
				...config,
			});
			return this.handleResponse<T>(response);
		} catch (error) {
			return this.handleError(error);
		}
	}

	async post<T>(url: string, data?: GenericDataValue, config?: RequestInit): Promise<ApiResponse<T>> {
		try {
			const response = await fetch(`${this.baseURL}${url}`, {
				method: 'POST',
				headers: {
					...HTTP_CLIENT_CONFIG.DEFAULT_HEADERS,
					...this.getAuthHeaders(),
					...config?.headers,
				},
				body: data ? JSON.stringify(data) : undefined,
				...config,
			});
			return this.handleResponse<T>(response);
		} catch (error) {
			return this.handleError(error);
		}
	}

	async put<T>(url: string, data?: GenericDataValue, config?: RequestInit): Promise<ApiResponse<T>> {
		try {
			const response = await fetch(`${this.baseURL}${url}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					...this.getAuthHeaders(),
					...config?.headers,
				},
				body: data ? JSON.stringify(data) : undefined,
				...config,
			});
			return this.handleResponse<T>(response);
		} catch (error) {
			return this.handleError(error);
		}
	}

	async delete<T>(url: string, config?: RequestInit): Promise<ApiResponse<T>> {
		try {
			const response = await fetch(`${this.baseURL}${url}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					...this.getAuthHeaders(),
					...config?.headers,
				},
				...config,
			});
			return this.handleResponse<T>(response);
		} catch (error) {
			return this.handleError(error);
		}
	}

	// Auth methods
	async login(credentials: AuthCredentials): Promise<AuthResponse> {
		const response = await this.post<AuthResponse>('/auth/login', credentials);
		return response.data;
	}

	async register(credentials: AuthCredentials): Promise<AuthResponse> {
		const response = await this.post<AuthResponse>('/auth/register', credentials);
		return response.data;
	}

	async logout(): Promise<void> {
		await this.post('/auth/logout');
		localStorage.removeItem('access_token');
		localStorage.removeItem('refresh_token');
	}

	async refreshToken(): Promise<{ access_token: string }> {
		const refreshToken = localStorage.getItem('refresh_token');
		if (!refreshToken) throw new Error('No refresh token');

		const response = await this.post<{ access_token: string }>('/auth/refresh', { refreshToken });
		return response.data;
	}

	async getCurrentUser(): Promise<unknown> {
		const response = await this.get<unknown>('/auth/me');
		return response.data;
	}

	isAuthenticated(): boolean {
		return !!localStorage.getItem('access_token');
	}

	getAuthToken(): string | null {
		return localStorage.getItem('access_token');
	}

	// User methods
	async getUserProfile(): Promise<unknown> {
		const response = await this.get<unknown>('/user/profile');
		return response.data;
	}

	async updateUserProfile(data: UserProfileUpdateData): Promise<unknown> {
		const response = await this.put<unknown>('/user/profile', data);
		return response.data;
	}

	async getUserCredits(): Promise<unknown> {
		const response = await this.get<unknown>('/user/credits');
		return response.data;
	}

	async deductCredits(amount: number): Promise<unknown> {
		const response = await this.post<unknown>('/user/credits/deduct', { amount });
		return response.data;
	}

	async updateProfile(data: UserProfileUpdateData): Promise<unknown> {
		const response = await this.put<unknown>('/user/profile', data);
		return response.data;
	}

	// Game methods
	async saveGameHistory(data: CreateGameHistoryDto): Promise<void> {
		const response = await this.post<void>('/game/history', data);
		return response.data;
	}

	async getUserGameHistory(limit?: number, offset?: number): Promise<unknown> {
		const params = new URLSearchParams();
		if (limit) params.append('limit', limit.toString());
		if (offset) params.append('offset', offset.toString());

		const response = await this.get<unknown>(`/game/history?${params}`);
		return response.data;
	}

	async getLeaderboardEntries(limit?: number): Promise<LeaderboardEntry[]> {
		const params = limit ? `?limit=${limit}` : '';
		const response = await this.get<LeaderboardEntry[]>(`/leaderboard${params}`);
		return response.data;
	}

	async getUserRank(): Promise<UserRank> {
		const response = await this.get<UserRank>('/user/rank');
		return response.data;
	}

	async getUserStats(): Promise<UserStats> {
		const response = await this.get<UserStats>('/user/stats');
		return response.data;
	}

	async getGameById(gameId: string): Promise<TriviaQuestion> {
		const response = await this.get<TriviaQuestion>(`/game/${gameId}`);
		return response.data;
	}

	// Points methods
	async getPointBalance(): Promise<PointBalance> {
		const response = await this.get<PointBalance>('/points/balance');
		return response.data;
	}

	async getPointPackages(): Promise<PointPurchaseOption[]> {
		const response = await this.get<PointPurchaseOption[]>('/points/packages');
		return response.data;
	}

	async canPlay(questionCount: number): Promise<CanPlayResponse> {
		const response = await this.get<CanPlayResponse>(`/points/can-play?count=${questionCount}`);
		return response.data;
	}

	async deductPoints(questionCount: number, gameMode: string): Promise<PointBalance> {
		const request: DeductPointsRequest = { questionCount, gameMode };
		const response = await this.post<PointBalance>('/points/deduct', request);
		return response.data;
	}

	async getPointHistory(limit?: number): Promise<PointTransaction[]> {
		const params = limit ? `?limit=${limit}` : '';
		const response = await this.get<PointTransaction[]>(`/points/history${params}`);
		return response.data;
	}

	async purchasePointPackage(packageId: string): Promise<PurchaseResponse> {
		const response = await this.post<PurchaseResponse>('/points/purchase', { packageId });
		return response.data;
	}

	async confirmPointPurchase(paymentIntentId: string): Promise<PointBalance> {
		const response = await this.post<PointBalance>('/points/confirm-purchase', { paymentIntentId });
		return response.data;
	}

	// Trivia methods
	async getTrivia(request: TriviaRequest): Promise<TriviaQuestion> {
		const response = await this.post<TriviaQuestion>('/trivia/questions', request);
		return response.data;
	}

	async saveHistory(data: CreateGameHistoryDto): Promise<void> {
		const response = await this.post<void>('/trivia/history', data);
		return response.data;
	}

	async getDifficultyStats(userId: string): Promise<DifficultyStats> {
		const response = await this.get<DifficultyStats>(`/trivia/difficulty-stats/${userId}`);
		return response.data;
	}

	async getLeaderboard(limit?: number): Promise<LeaderboardEntry[]> {
		const params = limit ? `?limit=${limit}` : '';
		const response = await this.get<LeaderboardEntry[]>(`/leaderboard${params}`);
		return response.data;
	}

	async getUserScore(userId: string): Promise<number> {
		const response = await this.get<number>(`/user/score/${userId}`);
		return response.data;
	}

	async validateCustomDifficulty(customText: string): Promise<CustomDifficultyValidationResponse> {
		const request: ValidateCustomDifficultyRequest = { customText };
		const response = await this.post<CustomDifficultyValidationResponse>('/trivia/validate-custom', request);
		return response.data;
	}

	async validateLanguage(text: string, options: LanguageValidationOptions = {}): Promise<LanguageValidationResult> {
		const request: ValidateLanguageRequest = { text, options };
		const response = await this.post<LanguageValidationResult>('/game/validate-language', request);
		return response.data;
	}
}

export const apiService = new ApiService();
