/**
 * Base Points Service
 *
 * @module BasePointsService
 * @description Abstract base service for points management with shared business logic
 * @author EveryTriv Team
 */
import { GameMode } from '@shared/constants';
import type { CanPlayResponse, PointBalance, PointPurchaseOption, SimpleValidationResult } from '@shared/types';

/**
 * Abstract base class for points management
 * Contains shared business logic for points calculation, validation, and management
 */
export abstract class BasePointsService {
	/**
	 * Calculate if user can play with current points
	 * @param balance - Current point balance
	 * @param questionCount - Number of questions to play
	 * @param gameMode - Game mode (affects point cost)
	 * @returns Object with canPlay status and reason
	 */
	protected canPlayWithPoints(balance: PointBalance, questionCount: number, gameMode: GameMode): CanPlayResponse {
		// Check if user has free questions available
		if (balance.canPlayFree && balance.freeQuestions >= questionCount) {
			return { canPlay: true, reason: 'Free questions available' };
		}

		// Check if user has enough purchased points
		const requiredPoints = this.calculateRequiredPoints(questionCount, gameMode);
		if (balance.purchasedPoints >= requiredPoints) {
			return { canPlay: true, reason: 'Sufficient purchased points' };
		}

		// Check if user has enough total points
		if (balance.totalPoints >= requiredPoints) {
			return { canPlay: true, reason: 'Sufficient total points' };
		}

		return {
			canPlay: false,
			reason: `Insufficient points. Required: ${requiredPoints}, Available: ${balance.totalPoints}`,
		};
	}

	/**
	 * Calculate required points for a game session
	 * @param questionCount - Number of questions
	 * @param gameMode - Game mode
	 * @returns Required points
	 */
	protected calculateRequiredPoints(questionCount: number, gameMode: GameMode): number {
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

		return Math.ceil(questionCount * costPerQuestion);
	}

	/**
	 * Calculate new balance after deducting points (LOGIC)
	 * @param currentBalance - Current point balance
	 * @param questionCount - Number of questions to play
	 * @param gameMode - Game mode played
	 * @returns New balance and deduction details
	 */
	protected calculateNewBalance(
		currentBalance: PointBalance,
		questionCount: number,
		_gameMode: GameMode = GameMode.QUESTION_LIMITED
	): {
		newBalance: PointBalance;
		deductionDetails: {
			freeQuestionsUsed: number;
			purchasedPointsUsed: number;
			creditsUsed: number;
		};
	} {
		let newPurchasedPoints = currentBalance.purchasedPoints;
		let newFreeQuestions = currentBalance.freeQuestions;
		let newCredits = currentBalance.totalPoints - currentBalance.purchasedPoints - currentBalance.freeQuestions * 0.1;

		let freeQuestionsUsed = 0;
		let purchasedPointsUsed = 0;
		let creditsUsed = 0;

		// DEDUCTION LOGIC: Use free questions first, then purchased points, then credits
		let remainingToDeduct = questionCount;

		// Step 1: Use free questions first
		if (newFreeQuestions > 0 && remainingToDeduct > 0) {
			freeQuestionsUsed = Math.min(newFreeQuestions, remainingToDeduct);
			newFreeQuestions -= freeQuestionsUsed;
			remainingToDeduct -= freeQuestionsUsed;
		}

		// Step 2: Use purchased points if needed
		if (remainingToDeduct > 0 && newPurchasedPoints > 0) {
			purchasedPointsUsed = Math.min(newPurchasedPoints, remainingToDeduct);
			newPurchasedPoints -= purchasedPointsUsed;
			remainingToDeduct -= purchasedPointsUsed;
		}

		// Step 3: Use regular credits if still needed
		if (remainingToDeduct > 0) {
			creditsUsed = remainingToDeduct;
			newCredits -= creditsUsed;
		}

		const newTotalPoints = newPurchasedPoints + newFreeQuestions * 0.1 + newCredits;

		return {
			newBalance: {
				...currentBalance,
				totalPoints: newTotalPoints,
				purchasedPoints: newPurchasedPoints,
				freeQuestions: newFreeQuestions,
			},
			deductionDetails: {
				freeQuestionsUsed,
				purchasedPointsUsed,
				creditsUsed,
			},
		};
	}

	/**
	 * Validate point purchase package
	 * @param packageId - Package ID to validate
	 * @param availablePackages - List of available packages
	 * @returns Validation result with package if valid
	 */
	protected validatePointPackage(
		packageId: string,
		availablePackages: PointPurchaseOption[]
	): SimpleValidationResult & { package?: PointPurchaseOption } {
		const packageToPurchase = availablePackages.find(pkg => pkg.id === packageId);
		const errors: string[] = [];

		if (!packageToPurchase) {
			errors.push('Invalid package ID');
			return { isValid: false, errors };
		}

		if (packageToPurchase.points <= 0) {
			errors.push('Package must contain positive points');
		}

		if (packageToPurchase.price <= 0) {
			errors.push('Package must have positive price');
		}

		if (packageToPurchase.pricePerPoint <= 0) {
			errors.push('Package must have positive price per point');
		}

		if (errors.length > 0) {
			return { isValid: false, errors };
		}

		return { isValid: true, errors: [], package: packageToPurchase };
	}

	/**
	 * Calculate point value for currency
	 * @param amount - Currency amount
	 * @param currency - Currency code
	 * @returns Point value
	 */
	protected calculatePointValue(amount: number, currency: string = 'USD'): number {
		// Base conversion rate (can be made configurable)
		const baseRate = 1; // 1 USD = 1 point

		// Currency conversion rates (simplified)
		const currencyRates: Record<string, number> = {
			USD: 1,
			EUR: 1.1,
			GBP: 1.3,
			ILS: 0.27, // Israeli Shekel
		};

		const rate = currencyRates[currency] || 1;
		return Math.floor(amount * rate * baseRate);
	}

	/**
	 * Format point balance for display
	 * @param balance - Point balance to format
	 * @returns Formatted balance string
	 */
	protected formatPointBalance(balance: PointBalance): string {
		const parts = [];

		if (balance.purchasedPoints > 0) {
			parts.push(`${balance.purchasedPoints} purchased`);
		}

		if (balance.freeQuestions > 0) {
			parts.push(`${balance.freeQuestions} free questions`);
		}

		if (parts.length === 0) {
			return '0 points';
		}

		return parts.join(' + ');
	}
}
