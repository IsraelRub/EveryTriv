import axios, { AxiosError } from 'axios';
import { TriviaQuestion } from '../models/trivia.model';

// Shared types between client and server
export interface ApiResponse<T> {
	data: T;
	status: number;
	message?: string;
}

export interface TriviaRequest {
	topic: string;
	difficulty: string;
	userId?: string;
}

export interface TriviaHistoryRequest {
	userId: string;
	question: string;
	answers: any[];
	correctAnswerIndex: number;
	isCorrect: boolean;
	topic: string;
	difficulty: string;
}

class ApiService {
	private baseURL = '/api';
	private retryAttempts = 3;
	private retryDelay = 1000;

	private async handleRequest<T>(request: () => Promise<ApiResponse<T>>, attempts = this.retryAttempts): Promise<T> {
		try {
			const response = await request();
			return response.data;
		} catch (error) {
			if (attempts > 0 && this.shouldRetry(error)) {
				await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
				return this.handleRequest(request, attempts - 1);
			}
			throw this.handleError(error as AxiosError);
		}
	}

	private shouldRetry(error: any): boolean {
		if (axios.isAxiosError(error)) {
			// Retry on network errors or 5xx server errors
			return !error.response || error.response.status >= 500;
		}
		return false;
	}

	private handleError(error: AxiosError): Error {
		if (error.response) {
			// Server responded with error
			const data = error.response.data;
			const message = (data && typeof data === 'object' && 'message' in data)
				? (data as { message?: string }).message
				: undefined;
			return new Error(message || 'Server error');
		} else if (error.request) {
			// Request made but no response
			return new Error('No response from server. Please check your connection.');
		}
		// Request setup error
		return new Error('Failed to make request. Please try again.');
	}

	async getTrivia(request: TriviaRequest): Promise<TriviaQuestion> {
		return this.handleRequest(async () => {
			const response = await axios.post<TriviaQuestion>(`${this.baseURL}/trivia`, request, {
				timeout: 10000, // 10 second timeout
				headers: { 'Content-Type': 'application/json' },
			});
			return { data: response.data, status: response.status };
		});
	}

	async saveHistory(data: TriviaHistoryRequest): Promise<void> {
		return this.handleRequest(async () => {
			const response = await axios.post(`${this.baseURL}/trivia/history`, data);
			return { data: response.data, status: response.status };
		});
	}

	async getUserScore(userId: string): Promise<number> {
		return this.handleRequest(async () => {
			const response = await axios.get(`${this.baseURL}/trivia/score?userId=${userId}`);
			return { data: response.data, status: response.status };
		});
	}

	async getLeaderboard(limit: number = 10): Promise<Array<{ userId: string; score: number }>> {
		return this.handleRequest(async () => {
			const response = await axios.get(`${this.baseURL}/trivia/leaderboard?limit=${limit}`);
			return { data: response.data, status: response.status };
		});
	}
}

export const apiService = new ApiService();
