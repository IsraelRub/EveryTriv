/**
 * Custom Difficulty Service
 * @module CustomDifficultyService
 * @description Service for managing custom difficulties and their history in localStorage
 * @used_by client/src/components/stats/CustomDifficultyHistory.tsx, client/src/views/game/CustomDifficultyView.tsx
 */
import { isRecord } from '@shared/utils';
import { isCustomDifficulty } from '@shared/validation';

import { CLIENT_STORAGE_KEYS } from '../constants';
import type { HistoryItem } from '../types';
import { storageService } from './storage.service';

/**
 * Type guard for history item array
 */
function isHistoryItemArray(value: unknown): value is HistoryItem[] {
	return (
		Array.isArray(value) &&
		value.every(
			item =>
				isRecord(item) &&
				typeof item.topic === 'string' &&
				typeof item.difficulty === 'string' &&
				typeof item.score === 'number' &&
				typeof item.date === 'string' &&
				(item.timestamp === undefined || typeof item.timestamp === 'number')
		)
	);
}

class CustomDifficultyService {
	private readonly CUSTOM_DIFFICULTIES_KEY = CLIENT_STORAGE_KEYS.CUSTOM_DIFFICULTIES;
	private readonly HISTORY_KEY = CLIENT_STORAGE_KEYS.CUSTOM_DIFFICULTY_HISTORY;
	private readonly MAX_HISTORY_ITEMS = 50;

	/**
	 * Get all saved custom difficulties
	 * @returns Array of custom difficulty strings
	 */
	async getCustomDifficulties(): Promise<string[]> {
		try {
			const result = await storageService.getStringArray(this.CUSTOM_DIFFICULTIES_KEY);
			return result.success && result.data ? result.data : [];
		} catch {
			return [];
		}
	}

	/**
	 * Save a custom difficulty
	 * @param difficulty Custom difficulty text
	 * @returns Resolves when difficulty is saved
	 */
	async saveCustomDifficulty(difficulty: string): Promise<void> {
		try {
			const difficulties = await this.getCustomDifficulties();
			if (!difficulties.includes(difficulty)) {
				difficulties.push(difficulty);
				await storageService.set(this.CUSTOM_DIFFICULTIES_KEY, difficulties);
			}
		} catch (error) {
			throw new Error(`Failed to save custom difficulty: ${error}`);
		}
	}

	/**
	 * Delete a custom difficulty
	 * @param difficulty Custom difficulty text to delete
	 * @returns Resolves when difficulty is deleted
	 */
	async deleteCustomDifficulty(difficulty: string): Promise<void> {
		try {
			const difficulties = await this.getCustomDifficulties();
			const filtered = difficulties.filter(d => d !== difficulty);
			await storageService.set(this.CUSTOM_DIFFICULTIES_KEY, filtered);
		} catch (error) {
			throw new Error(`Failed to delete custom difficulty: ${error}`);
		}
	}

	/**
	 * Get custom difficulty history
	 * @returns Array of history items
	 */
	async getHistory(): Promise<HistoryItem[]> {
		try {
			const result = await storageService.get<HistoryItem[]>(this.HISTORY_KEY, isHistoryItemArray);
			return result.success && result.data ? result.data : [];
		} catch {
			return [];
		}
	}

	/**
	 * Add or update an entry in custom difficulty history
	 * @param topic Topic used with the custom difficulty
	 * @param difficulty Custom difficulty text
	 * @param score Optional score from the game (default: 0)
	 * @returns Resolves when history entry is added or updated
	 */
	async addToHistory(topic: string, difficulty: string, score: number = 0): Promise<void> {
		try {
			if (!isCustomDifficulty(difficulty)) {
				return;
			}

			const history = await this.getHistory();
			const timestamp = Date.now();

			// Find existing item with same topic + difficulty
			const existingIndex = history.findIndex(item => item.topic === topic && item.difficulty === difficulty);

			if (existingIndex !== -1) {
				// Update existing item with new score and timestamp
				const updated = [...history];
				updated[existingIndex] = {
					...updated[existingIndex],
					score: Math.max(updated[existingIndex].score, score), // Keep the highest score
					date: new Date(timestamp).toISOString(),
					timestamp,
				};

				// Move to the beginning
				const [updatedItem] = updated.splice(existingIndex, 1);
				const reordered = [updatedItem, ...updated];

				// Limit history size
				const limited = reordered.slice(0, this.MAX_HISTORY_ITEMS);
				await storageService.set(this.HISTORY_KEY, limited);
			} else {
				// Add new item
				const newItem: HistoryItem = {
					topic,
					difficulty,
					score,
					date: new Date(timestamp).toISOString(),
					timestamp,
				};

				// Add new item at the beginning
				const updated = [newItem, ...history];

				// Limit history size
				const limited = updated.slice(0, this.MAX_HISTORY_ITEMS);

				await storageService.set(this.HISTORY_KEY, limited);
			}
		} catch (error) {
			throw new Error(`Failed to add to history: ${error}`);
		}
	}

	/**
	 * Clear custom difficulty history
	 * @returns Resolves when history is cleared
	 */
	async clearHistory(): Promise<void> {
		try {
			await storageService.set(this.HISTORY_KEY, []);
		} catch (error) {
			throw new Error(`Failed to clear history: ${error}`);
		}
	}
}

export const customDifficultyService = new CustomDifficultyService();
