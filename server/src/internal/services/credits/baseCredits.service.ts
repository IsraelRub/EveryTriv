/**
 * Base Credits Service
 *
 * @module BaseCreditsService
 * @description Abstract base service for credits management with shared business logic
 * @author EveryTriv Team
 */
import { CREDIT_COSTS, GameMode, TIME_LIMITED_CREDITS_PER_30_SECONDS } from '@shared/constants';
import type { BaseValidationResult, CanPlayResponse, CreditBalance, CreditPurchaseOption } from '@shared/types';

/**
 * Abstract base class for credits management
 * Contains shared business logic for credits calculation, validation, and management
 *
 * Credit Methodology:
 * - QUESTION_LIMITED: 1 credit per question (e.g., 10 questions = 10 credits)
 * - TIME_LIMITED: Fixed 10 credits per game (regardless of questions answered)
 * - UNLIMITED: 1 credit per question answered (charged after game)
 * - MULTIPLAYER: 1 credit per question (host pays only)
 */
export abstract class BaseCreditsService {
	/**
	 * Calculate if user can play with current credits
	 * @param balance Current credit balance
	 * @param questionsPerRequest Number of questions per request
	 * @param gameMode Game mode (affects credit cost)
	 * @returns Object with canPlay status and reason
	 */
	protected canPlayWithCredits(
		balance: CreditBalance,
		questionsPerRequest: number,
		gameMode: GameMode
	): CanPlayResponse {
		// Check if user has free questions available
		const requiredCredits = this.calculateRequiredCredits(questionsPerRequest, gameMode);
		if (balance.canPlayFree && balance.freeQuestions >= requiredCredits) {
			return { canPlay: true, reason: 'Free questions available' };
		}

		// Check if user has enough purchased credits
		if (balance.purchasedCredits >= requiredCredits) {
			return { canPlay: true, reason: 'Sufficient purchased credits' };
		}

		// Check if user has enough total credits
		if (balance.totalCredits >= requiredCredits) {
			return { canPlay: true, reason: 'Sufficient total credits' };
		}

		return {
			canPlay: false,
			reason: `Insufficient credits. Required: ${requiredCredits}, Available: ${balance.totalCredits}`,
		};
	}

	/**
	 * Calculate credits for TIME_LIMITED mode based on time in seconds
	 * @param timeInSeconds Time limit in seconds
	 * @returns Required credits (5 credits per 30 seconds)
	 */
	protected calculateTimeLimitedCredits(timeInSeconds: number): number {
		// 5 credits per 30 seconds
		const thirtySecondIntervals = Math.ceil(timeInSeconds / 30);
		return thirtySecondIntervals * TIME_LIMITED_CREDITS_PER_30_SECONDS;
	}

	/**
	 * Calculate required credits for a game session
	 * @param questionsOrTime For QUESTION_LIMITED/UNLIMITED/MULTIPLAYER: number of questions.
	 *                        For TIME_LIMITED: time in seconds.
	 * @param gameMode Game mode
	 * @returns Required credits
	 *
	 * Credit Methodology:
	 * - QUESTION_LIMITED: 1 credit per question
	 * - TIME_LIMITED: 5 credits per 30 seconds (60 sec = 10 credits)
	 * - UNLIMITED: 1 credit per question answered
	 * - MULTIPLAYER: 1 credit per question
	 */
	protected calculateRequiredCredits(questionsOrTime: number, gameMode: GameMode): number {
		const costConfig = CREDIT_COSTS[gameMode];

		// For TIME_LIMITED, calculate based on time (5 credits per 30 seconds)
		if (gameMode === GameMode.TIME_LIMITED) {
			return this.calculateTimeLimitedCredits(questionsOrTime);
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
	protected shouldChargeAfterGame(gameMode: GameMode): boolean {
		return CREDIT_COSTS[gameMode]?.chargeAfterGame ?? false;
	}

	/**
	 * Check if only the host should pay for a multiplayer game
	 * @param gameMode Game mode to check
	 * @returns true if only host pays, false otherwise
	 */
	protected isHostPaysOnly(gameMode: GameMode): boolean {
		const costConfig = CREDIT_COSTS[gameMode];
		return 'hostPaysOnly' in costConfig && costConfig.hostPaysOnly === true;
	}

	/**
	 * Validate credit purchase package
	 * @param packageId Package ID to validate
	 * @param availablePackages List of available packages
	 * @returns Validation result with package if valid
	 */
	protected validateCreditPackage(
		packageId: string,
		availablePackages: CreditPurchaseOption[]
	): BaseValidationResult & { package?: CreditPurchaseOption } {
		const packageToPurchase = availablePackages.find(pkg => pkg.id === packageId);
		const errors: string[] = [];

		if (!packageToPurchase) {
			errors.push('Invalid package ID');
			return { isValid: false, errors };
		}

		if (packageToPurchase.credits <= 0) {
			errors.push('Package must contain positive credits');
		}

		if (packageToPurchase.price <= 0) {
			errors.push('Package must have positive price');
		}

		if (packageToPurchase.pricePerCredit <= 0) {
			errors.push('Package must have positive price per credit');
		}

		if (errors.length > 0) {
			return { isValid: false, errors };
		}

		return { isValid: true, errors: [], package: packageToPurchase };
	}
}
