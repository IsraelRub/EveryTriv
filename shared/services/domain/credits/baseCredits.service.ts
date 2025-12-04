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
		if (balance.canPlayFree && balance.freeQuestions >= questionsPerRequest) {
			return { canPlay: true, reason: 'Free questions available' };
		}

		// Check if user has enough purchased credits
		const requiredCredits = this.calculateRequiredCredits(questionsPerRequest, gameMode);
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
	 * @param questionsPerRequest Number of questions per request
	 * @param gameMode Game mode
	 * @returns Required credits
	 */
	protected calculateRequiredCredits(questionsPerRequest: number, gameMode: GameMode): number {
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

		return Math.ceil(questionsPerRequest * costPerQuestion);
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
