import axios, { AxiosError } from 'axios';
import logger from './logger.service';

// Import shared types
import { 
	TriviaQuestion, 
	TriviaRequest, 
	TriviaHistoryRequest,
	ApiResponse,
	DifficultyStats,
	CustomDifficultySuggestions
} from '../../../../shared/types/api.types';

// Import shared validation
import { validateCustomDifficultyText } from '../../../../shared/validation/validation.utils';

class ApiService {
	private baseURL = '/v1';
	private retryAttempts = 3;
	private retryDelay = 1000;

	private async handleRequest<T>(
		request: () => Promise<ApiResponse<T>>, 
		attempts = this.retryAttempts,
		operationName = 'API Request'
	): Promise<T> {
		const startTime = Date.now();
		
		try {
			logger.debug(`🚀 Starting ${operationName}`, { 
				attempts: this.retryAttempts - attempts + 1,
				maxRetries: this.retryAttempts,
				timestamp: new Date().toISOString()
			});
			
			const response = await request();
			const duration = Date.now() - startTime;
			
			logger.performance(`${operationName} completed`, duration, {
				success: true,
				statusCode: 200,
				dataSize: JSON.stringify(response).length
			});
			
			logger.api(`${operationName} completed`, {
				statusCode: response.status,
				duration: `${duration}ms`,
				success: true,
				attempts: this.retryAttempts - attempts + 1
			});
			
			return response.data;
		} catch (error) {
			const errorDuration = Date.now() - startTime;
			
			if (attempts > 0 && this.shouldRetry(error)) {
				logger.warn(`Retrying ${operationName}`, { 
					attemptsLeft: attempts - 1,
					duration: errorDuration,
					error: error instanceof Error ? error.message : 'Unknown error'
				});
				
				await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
				return this.handleRequest(request, attempts - 1, operationName);
			}
			
			logger.error(`Failed ${operationName}`, {
				duration: errorDuration,
				totalAttempts: this.retryAttempts - attempts + 1,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
			
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
			let message = 'Server error';
			
			if (data && typeof data === 'object') {
				if ('message' in data) {
					message = (data as { message?: string }).message || message;
				}
				// טיפול מיוחד בשגיאות רמת קושי מותאמת
				if ('suggestion' in data) {
					message += ` ${(data as { suggestion?: string }).suggestion}`;
				}
			}
			
			return new Error(message);
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
				timeout: 15000, // הגדלתי timeout עבור רמות קושי מותאמות
				headers: { 'Content-Type': 'application/json' },
			});
			return { data: response.data, status: response.status };
		}, this.retryAttempts, `GET Trivia [${request.topic}/${request.difficulty}]`);
	}

	async saveHistory(data: TriviaHistoryRequest): Promise<void> {
		return this.handleRequest(async () => {
			const response = await axios.post(`${this.baseURL}/trivia/history`, data);
			return { data: response.data, status: response.status };
		}, this.retryAttempts, 'Save Game History');
	}

	async getUserScore(userId: string): Promise<number> {
		return this.handleRequest(async () => {
			const response = await axios.get(`${this.baseURL}/trivia/score?userId=${userId}`);
			return { data: response.data, status: response.status };
		}, this.retryAttempts, `GET User Score [${userId}]`);
	}

	async getLeaderboard(limit: number = 10): Promise<Array<{ userId: string; score: number }>> {
		return this.handleRequest(async () => {
			const response = await axios.get(`${this.baseURL}/trivia/leaderboard?limit=${limit}`);
			return { data: response.data, status: response.status };
		}, this.retryAttempts, `GET Leaderboard [limit=${limit}]`);
	}

	// נקודות קצה חדשות לרמות קושי מותאמות
	async getDifficultyStats(userId?: string): Promise<DifficultyStats> {
		return this.handleRequest(async () => {
			const url = userId 
				? `${this.baseURL}/trivia/difficulty-stats?userId=${userId}`
				: `${this.baseURL}/trivia/difficulty-stats`;
			const response = await axios.get(url);
			return { data: response.data, status: response.status };
		});
	}

	async getCustomDifficultySuggestions(topic?: string): Promise<CustomDifficultySuggestions> {
		return this.handleRequest(async () => {
			const url = topic 
				? `${this.baseURL}/trivia/custom-difficulty-suggestions?topic=${encodeURIComponent(topic)}`
				: `${this.baseURL}/trivia/custom-difficulty-suggestions`;
			const response = await axios.get(url);
			return { data: response.data, status: response.status };
		});
	}

	// ולידציה מקומית של רמת קושי מותאמת לפני שליחה לשרת
	validateCustomDifficulty(customText: string): { isValid: boolean; error?: string } {
		// Use shared validation function
		return validateCustomDifficultyText(customText);
	}

	// שמירת רמות קושי מותאמות שנוצרו בעבר (localStorage)
	saveCustomDifficulty(topic: string, difficulty: string): void {
		try {
			const key = 'everytriv_custom_difficulties';
			const existing = JSON.parse(localStorage.getItem(key) || '[]');
			const newEntry = { topic, difficulty, timestamp: Date.now() };
			
			// הסרת כפילויות
			const filtered = existing.filter((item: any) => 
				!(item.topic === topic && item.difficulty === difficulty)
			);
			
			// הוספה בתחילת הרשימה והגבלה ל-50 פריטים
			const updated = [newEntry, ...filtered].slice(0, 50);
			
			localStorage.setItem(key, JSON.stringify(updated));
		} catch (error) {
			console.warn('Failed to save custom difficulty to localStorage:', error);
		}
	}

	getRecentCustomDifficulties(limit: number = 10): Array<{ topic: string; difficulty: string; timestamp: number }> {
		try {
			const key = 'everytriv_custom_difficulties';
			const stored = JSON.parse(localStorage.getItem(key) || '[]');
			return stored.slice(0, limit);
		} catch (error) {
			console.warn('Failed to load custom difficulties from localStorage:', error);
			return [];
		}
	}

	clearCustomDifficulties(): void {
		try {
			localStorage.removeItem('everytriv_custom_difficulties');
		} catch (error) {
			console.warn('Failed to clear custom difficulties:', error);
		}
	}
}

export const apiService = new ApiService();