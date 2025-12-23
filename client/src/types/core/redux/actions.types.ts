/**
 * Redux Action Types
 * @module ReduxActionTypes
 * @description Redux action payload types
 */

// Action Payload Types
export interface CreditBalancePayload {
	balance: number;
	purchasedCredits: number;
	freeQuestions: number;
	lastUpdated: string;
	dailyLimit?: number;
	nextResetTime?: string | null;
	credits?: number;
}

export interface ScoreUpdatePayload {
	score: number;
	timeSpent: number;
	isCorrect: boolean;
}
