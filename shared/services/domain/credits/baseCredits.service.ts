/**
 * Base Credits Service
 *
 * @module BaseCreditsService
 * @description Abstract base service for credits management with shared business logic
 * @author EveryTriv Team
 */
import { GameMode } from '@shared/constants';
import type { BaseValidationResult, CanPlayResponse, CreditBalance, CreditPurchaseOption } from '@shared/types';

/**
 * Abstract base class for credits management
 * Contains shared business logic for credits calculation, validation, and management
 */
export abstract class BaseCreditsService {
	/**
	 * Calculate if user can play with current credits
	 * @param balance Current credit balance
	 * @param requestedQuestions Number of questions requested
	 * @param gameMode Game mode (affects credit cost)
	 * @returns Object with canPlay status and reason
	 */
	protected canPlayWithCredits(
		balance: CreditBalance,
		requestedQuestions: number,
		gameMode: GameMode
	): CanPlayResponse {
		// Check if user has free questions available
		if (balance.canPlayFree && balance.freeQuestions >= requestedQuestions) {
			return { canPlay: true, reason: 'Free questions available' };
		}

		// Check if user has enough purchased credits
		const requiredCredits = this.calculateRequiredCredits(requestedQuestions, gameMode);
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
	 * Calculate required credits for a game session
	 * @param requestedQuestions Number of questions requested
	 * @param gameMode Game mode
	 * @returns Required credits
	 */
	protected calculateRequiredCredits(requestedQuestions: number, gameMode: GameMode): number {
		// Base cost per question
		let costPerQuestion = 1;

		// Adjust cost based on game mode
		switch (gameMode) {
			case GameMode.TIME_LIMITED:
				costPerQuestion = 1.5; // Time-limited games cost more
				break;
			case GameMode.QUESTION_LIMITED:
				costPerQuestion = 1; // Standard cost
				break;
			case GameMode.UNLIMITED:
				costPerQuestion = 0.8; // Endless mode is cheaper
				break;
			default:
				costPerQuestion = 1;
		}

		return Math.ceil(requestedQuestions * costPerQuestion);
	}

	/**
	 * Calculate new balance after deducting credits (LOGIC)
	 * @param currentBalance Current credit balance
	 * @param requestedQuestions Number of questions requested
	 * @param gameMode Game mode played
	 * @returns New balance and deduction details
	 */
	protected calculateNewBalance(
		currentBalance: CreditBalance,
		requestedQuestions: number,
		gameMode: GameMode = GameMode.QUESTION_LIMITED
	): {
		newBalance: CreditBalance;
		deductionDetails: {
			freeQuestionsUsed: number;
			purchasedCreditsUsed: number;
			creditsUsed: number;
		};
	} {
		let newPurchasedCredits = currentBalance.purchasedCredits;
		let newFreeQuestions = currentBalance.freeQuestions;
		// Extract credits from currentBalance (fallback to totalCredits - purchasedCredits - freeQuestions for backward compatibility)
		let newCredits =
			currentBalance.credits ??
			currentBalance.totalCredits - currentBalance.purchasedCredits - currentBalance.freeQuestions;

		let freeQuestionsUsed = 0;
		let purchasedCreditsUsed = 0;
		let creditsUsed = 0;

		// Calculate required credits based on game mode
		// NOTE: requiredCredits may differ from requestedQuestions due to gameMode cost multipliers
		const requiredCredits = this.calculateRequiredCredits(requestedQuestions, gameMode);

		// DEDUCTION LOGIC: Use free questions first, then purchased credits, then credits
		// IMPORTANT: Free questions use requestedQuestions directly (1:1 ratio)
		// Credits use requiredCredits (which may be different due to gameMode multipliers)
		const remainingFreeQuestionsToUse = requestedQuestions;
		let remainingCreditsToDeduct = requiredCredits;

		// Step 1: Use free questions first (1 free question = 1 question, uses requestedQuestions directly)
		if (newFreeQuestions > 0 && remainingFreeQuestionsToUse > 0) {
			freeQuestionsUsed = Math.min(newFreeQuestions, remainingFreeQuestionsToUse);
			newFreeQuestions -= freeQuestionsUsed;
			// Each free question used reduces the required credits by its cost (not 1:1)
			// Calculate how many credits were "saved" by using free questions
			const creditsSavedByFreeQuestions = this.calculateRequiredCredits(freeQuestionsUsed, gameMode);
			remainingCreditsToDeduct = Math.max(0, remainingCreditsToDeduct - creditsSavedByFreeQuestions);
		}

		// Step 2: Use purchased credits if needed (uses requiredCredits, not requestedQuestions)
		if (remainingCreditsToDeduct > 0 && newPurchasedCredits > 0) {
			purchasedCreditsUsed = Math.min(newPurchasedCredits, remainingCreditsToDeduct);
			newPurchasedCredits -= purchasedCreditsUsed;
			remainingCreditsToDeduct -= purchasedCreditsUsed;
		}

		// Step 3: Use regular credits if still needed (uses requiredCredits, not requestedQuestions)
		if (remainingCreditsToDeduct > 0) {
			creditsUsed = remainingCreditsToDeduct;
			newCredits -= creditsUsed;
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
