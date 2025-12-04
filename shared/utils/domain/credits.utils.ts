/**
 * Credits Utilities (pure functions, browser-safe)
 *
 * @module CreditsUtils
 * @description A set of pure utility functions for credits calculations that can be safely used
 * @used_by both client (browser) and server (Node). No NestJS or platform-specific deps.
 */
import { GameMode } from '@shared/constants';
import type { CreditBalance } from '@shared/types';

/**
 * Calculate required credits for a game session
 * @param questionsPerRequest Number of questions requested
 * @param gameMode Game mode (affects credit cost)
 * @returns Required credits
 * @description Client-side version that matches server-side calculation logic.
 * Server should use BaseCreditsService.calculateRequiredCredits().
 */
export function calculateRequiredCredits(questionsPerRequest: number, gameMode: GameMode): number {
	let costPerQuestion = 1;

	switch (gameMode) {
		case GameMode.TIME_LIMITED:
			costPerQuestion = 1.5;
			break;
		case GameMode.QUESTION_LIMITED:
			costPerQuestion = 1;
			break;
		case GameMode.UNLIMITED:
			costPerQuestion = 0.8;
			break;
		default:
			costPerQuestion = 1;
	}

	return Math.ceil(questionsPerRequest * costPerQuestion);
}

/**
 * Calculate new balance after deducting credits (LOGIC)
 * Pure function that can be used by both client and server
 * @param currentBalance Current credit balance
 * @param questionsPerRequest Number of questions requested
 * @param gameMode Game mode played (affects credit cost)
 * @returns New balance and deduction details
 * @description Shared deduction logic that ensures consistency between client (optimistic updates) and server.
 * Deduction order: freeQuestions → purchasedCredits → credits
 */
export function calculateNewBalance(
	currentBalance: CreditBalance,
	questionsPerRequest: number,
	gameMode: GameMode = GameMode.QUESTION_LIMITED
): {
	newBalance: CreditBalance;
	deductionDetails: {
		freeQuestionsUsed: number;
		purchasedCreditsUsed: number;
		creditsUsed: number;
	};
} {
	let newPurchasedCredits = currentBalance.purchasedCredits ?? 0;
	let newFreeQuestions = currentBalance.freeQuestions ?? 0;
	// Extract credits from currentBalance (fallback to totalCredits - purchasedCredits - freeQuestions for backward compatibility)
	let newCredits =
		currentBalance.credits ??
		currentBalance.totalCredits - (currentBalance.purchasedCredits ?? 0) - (currentBalance.freeQuestions ?? 0);

	let freeQuestionsUsed = 0;
	let purchasedCreditsUsed = 0;
	let creditsUsed = 0;

	// Calculate required credits based on game mode
	// NOTE: requiredCredits may differ from questionsPerRequest due to gameMode cost multipliers
	const requiredCredits = calculateRequiredCredits(questionsPerRequest, gameMode);

	// DEDUCTION LOGIC: Use free questions first, then purchased credits, then credits
	// IMPORTANT: Free questions use questionsPerRequest directly (1:1 ratio)
	// Credits use requiredCredits (which may be different due to gameMode multipliers)
	const remainingFreeQuestionsToUse = questionsPerRequest;
	let remainingCreditsToDeduct = requiredCredits;

	// Step 1: Use free questions first (1 free question = 1 question, uses questionsPerRequest directly)
	if (newFreeQuestions > 0 && remainingFreeQuestionsToUse > 0) {
		freeQuestionsUsed = Math.min(newFreeQuestions, remainingFreeQuestionsToUse);
		newFreeQuestions -= freeQuestionsUsed;
		// Each free question used reduces the required credits by its cost (not 1:1)
		// Calculate how many credits were "saved" by using free questions
		const creditsSavedByFreeQuestions = calculateRequiredCredits(freeQuestionsUsed, gameMode);
		remainingCreditsToDeduct = Math.max(0, remainingCreditsToDeduct - creditsSavedByFreeQuestions);
	}

	// Step 2: Use purchased credits if needed (uses requiredCredits, not questionsPerRequest)
	if (remainingCreditsToDeduct > 0 && newPurchasedCredits > 0) {
		purchasedCreditsUsed = Math.min(newPurchasedCredits, remainingCreditsToDeduct);
		newPurchasedCredits -= purchasedCreditsUsed;
		remainingCreditsToDeduct -= purchasedCreditsUsed;
	}

	// Step 3: Use regular credits if still needed (uses requiredCredits, not questionsPerRequest)
	if (remainingCreditsToDeduct > 0) {
		creditsUsed = remainingCreditsToDeduct;
		newCredits = Math.max(0, newCredits - creditsUsed);
	}

	// Calculate totalCredits as sum of all sources
	const newTotalCredits = newCredits + newPurchasedCredits + newFreeQuestions;

	return {
		newBalance: {
			...currentBalance,
			totalCredits: newTotalCredits,
			credits: newCredits,
			purchasedCredits: newPurchasedCredits,
			freeQuestions: newFreeQuestions,
			canPlayFree: newFreeQuestions > 0,
		},
		deductionDetails: {
			freeQuestionsUsed,
			purchasedCreditsUsed,
			creditsUsed,
		},
	};
}
