import { CREDIT_COSTS, GameMode, TIME_LIMITED_CREDITS_PER_30_SECONDS } from '@shared/constants';
import type { CreditBalance } from '@shared/types';

export function calculateTimeLimitedCredits(timeInSeconds: number): number {
	// 5 credits per 30 seconds
	// 30 sec = 5, 60 sec = 10, 90 sec = 15, 120 sec = 20, etc.
	const thirtySecondIntervals = Math.ceil(timeInSeconds / 30);
	return thirtySecondIntervals * TIME_LIMITED_CREDITS_PER_30_SECONDS;
}

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

export function shouldChargeAfterGame(gameMode: GameMode): boolean {
	return CREDIT_COSTS[gameMode]?.chargeAfterGame ?? false;
}

export function isHostPaysOnly(gameMode: GameMode): boolean {
	const costConfig = CREDIT_COSTS[gameMode];
	return 'hostPaysOnly' in costConfig && costConfig.hostPaysOnly === true;
}

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
