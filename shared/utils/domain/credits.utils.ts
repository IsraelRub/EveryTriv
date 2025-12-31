/**
 * Credits Utilities (pure functions, browser-safe)
 *
 * @module CreditsUtils
 * @description A set of pure utility functions for credits calculations that can be safely used
 * @used_by both client (browser) and server (Node). No NestJS or platform-specific deps.
 */
import { CREDIT_COSTS, GameMode, TIME_LIMITED_CREDITS_PER_30_SECONDS } from '@shared/constants';
import type { CreditBalance } from '@shared/types';

/**
 * Calculate credits for TIME_LIMITED mode based on time in seconds
 * @param timeInSeconds Time limit in seconds
 * @returns Required credits (5 credits per 30 seconds)
 */
export function calculateTimeLimitedCredits(timeInSeconds: number): number {
	// 5 credits per 30 seconds
	// 30 sec = 5, 60 sec = 10, 90 sec = 15, 120 sec = 20, etc.
	const thirtySecondIntervals = Math.ceil(timeInSeconds / 30);
	return thirtySecondIntervals * TIME_LIMITED_CREDITS_PER_30_SECONDS;
}

/**
 * Calculate required credits for a game session
 * @param questionsOrTime For QUESTION_LIMITED/UNLIMITED/MULTIPLAYER: number of questions.
 *                        For TIME_LIMITED: time in seconds.
 * @param gameMode Game mode (affects credit cost)
 * @returns Required credits
 * @description Unified credit calculation used by both client and server.
 *
 * Credit Methodology:
 * - QUESTION_LIMITED: 1 credit per question (e.g., 10 questions = 10 credits)
 * - TIME_LIMITED: 5 credits per 30 seconds (e.g., 60 sec = 10 credits, 120 sec = 20 credits)
 * - UNLIMITED: 1 credit per question answered (charged after game)
 * - MULTIPLAYER: 1 credit per question (host pays only)
 */
export function calculateRequiredCredits(questionsOrTime: number, gameMode: GameMode): number {
	const costConfig = CREDIT_COSTS[gameMode];

	// For TIME_LIMITED, calculate based on time (5 credits per 30 seconds)
	if (gameMode === GameMode.TIME_LIMITED) {
		return calculateTimeLimitedCredits(questionsOrTime);
	}

	// If the mode has a fixed cost, use it
	if (costConfig?.fixedCost !== undefined) {
		return costConfig.fixedCost;
	}

	// Otherwise, calculate based on cost per question (default: 1 credit = 1 question)
	const costPerQuestion = costConfig?.costPerQuestion ?? 1;
	return Math.ceil(questionsOrTime * costPerQuestion);
}

/**
 * Check if credits should be charged after the game ends
 * @param gameMode Game mode to check
 * @returns true if credits should be charged after game, false if before
 */
export function shouldChargeAfterGame(gameMode: GameMode): boolean {
	return CREDIT_COSTS[gameMode]?.chargeAfterGame ?? false;
}

/**
 * Check if only the host should pay for a multiplayer game
 * @param gameMode Game mode to check
 * @returns true if only host pays, false otherwise
 */
export function isHostPaysOnly(gameMode: GameMode): boolean {
	const costConfig = CREDIT_COSTS[gameMode];
	return 'hostPaysOnly' in costConfig && costConfig.hostPaysOnly === true;
}

/**
 * Calculate new balance after deducting credits (LOGIC)
 * Pure function that can be used by both client and server
 * @param currentBalance Current credit balance
 * @param questionsPerRequest Number of questions requested (or answered for UNLIMITED mode)
 * @param gameMode Game mode played (affects credit cost)
 * @returns New balance and deduction details
 * @description Shared deduction logic that ensures consistency between client (optimistic updates) and server.
 * Deduction order: freeQuestions → purchasedCredits → credits
 *
 * Credit Methodology:
 * - QUESTION_LIMITED: 1 credit per question
 * - TIME_LIMITED: Fixed 10 credits per game
 * - UNLIMITED: 1 credit per question answered (pass actual questions answered)
 * - MULTIPLAYER: 1 credit per question (host pays only)
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
	// New methodology: 1 credit = 1 question (except TIME_LIMITED which is fixed 10)
	const requiredCredits = calculateRequiredCredits(questionsPerRequest, gameMode);

	// DEDUCTION LOGIC: Use free questions first, then purchased credits, then credits
	// With new methodology, 1 free question = 1 credit (simple 1:1 ratio)
	let remainingCreditsToDeduct = requiredCredits;

	// Step 1: Use free questions first (1 free question = 1 credit)
	if (newFreeQuestions > 0 && remainingCreditsToDeduct > 0) {
		freeQuestionsUsed = Math.min(newFreeQuestions, remainingCreditsToDeduct);
		newFreeQuestions -= freeQuestionsUsed;
		remainingCreditsToDeduct -= freeQuestionsUsed;
	}

	// Step 2: Use purchased credits if needed
	if (remainingCreditsToDeduct > 0 && newPurchasedCredits > 0) {
		purchasedCreditsUsed = Math.min(newPurchasedCredits, remainingCreditsToDeduct);
		newPurchasedCredits -= purchasedCreditsUsed;
		remainingCreditsToDeduct -= purchasedCreditsUsed;
	}

	// Step 3: Use regular credits if still needed
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
