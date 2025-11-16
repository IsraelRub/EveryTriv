/**
 * Redux Action Types
 * @module ReduxActionTypes
 * @description Redux action payload types
 */

// Action Payload Types
export interface FavoritePayload {
	type: 'topic' | 'difficulty' | 'game';
	value: string;
	action: 'add' | 'remove' | 'toggle';
	topic?: string;
	difficulty?: string;
}

export interface PointBalancePayload {
	balance: number;
	purchasedPoints: number;
	freePoints: number;
	lastUpdated: Date;
	dailyLimit?: number;
	nextResetTime?: string | null;
	points?: number;
}

export interface ScoreUpdatePayload {
	score: number;
	timeSpent: number;
	isCorrect: boolean;
	responseTime: number;
	correct?: boolean;
	totalTime?: number;
}
